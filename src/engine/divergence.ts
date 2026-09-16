/**
 * Where the selected traditions disagree, and where they agree.
 *
 * This is the product. Not the placements -- the relationship between them.
 *
 * Two findings, not a finding and a failure:
 *
 *   Divergence  -- the systems place a body differently. Interesting because
 *                  it exposes the assumptions each system is built on.
 *   Convergence -- the systems place it identically. The stronger signal,
 *                  because frames built on different foundations landed in the
 *                  same place anyway.
 *
 * Neither is a pass or a fail. Both are results.
 *
 * Each is computed on two independent axes, which have different causes:
 *
 *   Sign   -- driven by the ayanamsa, the systems' differing zodiac origins.
 *   House  -- driven mainly by the house system, Placidus against whole sign,
 *             and only sometimes by the ayanamsa as well.
 *
 * Everything here describes systems. Nothing describes a person, predicts
 * anything, or offers advice.
 */
// Type-only: importing a value from chart.ts here would pull the ephemeris
// and its wasm glue back onto the critical path, undoing the dynamic import
// in App.tsx. The one helper needed is three lines, so it lives here.
import type { Chart, Placement, PointId, SystemResult } from './chart'

import { type Association, houseAssociations, signAssociations } from './associations'
import { formatDegrees, norm360, signOf } from './signs'
import { type SystemId, SYSTEMS } from './systems'

/** Pull one point out of a system result. */
function placementOf(result: SystemResult, point: PointId): Placement | null {
  if (point === 'ascendant') return result.ascendant
  return result.placements.find((placement) => placement.point === point) ?? null
}

export type Verdict = 'converge' | 'diverge' | 'undefined'

export type HouseCause =
  /** The house systems carve the same sky differently. */
  | 'house-system'
  /**
   * The ayanamsa moved a body and the Ascendant by different numbers of signs,
   * so the whole sign count starts from a different place.
   */
  | 'ayanamsa-and-house-system'

export interface AxisComparison {
  verdict: Verdict
  /** How many distinct values the selected systems produced. */
  distinctValues: number
  explanation: string
  /** Present only when the systems converge. */
  associations: Association[]
}

export interface SignComparison extends AxisComparison {
  /** The agreed sign name, when they converge. */
  convergedSign: string | null
}

export interface HouseComparison extends AxisComparison {
  convergedHouse: number | null
  cause: HouseCause | null
}

export interface ComparisonRow {
  point: PointId
  label: string
  /** Placement per system, in selection order. Null where undefined. */
  placements: { systemId: SystemId; systemName: string; placement: Placement | null }[]
  sign: SignComparison
  house: HouseComparison
  /** True when either axis disagrees. */
  diverges: boolean
  /** True when either axis agrees across every selected system. */
  converges: boolean
}

export interface Comparison {
  rows: ComparisonRow[]
  systemIds: SystemId[]
  /** Ayanamsa per system, degrees. Zero for a tropical zodiac. */
  ayanamsas: { systemId: SystemId; systemName: string; degrees: number; label: string }[]
  /** Largest gap between any two selected zodiac origins, degrees. */
  widestZodiacGap: number
  /**
   * The width of the window in which every selected system agrees on a sign.
   *
   * A placement keeps its sign across systems only if it sits further into
   * that sign than the widest gap between their zodiac origins. With Western
   * and Vedic selected that window is under six degrees, which is why sign
   * agreement is the rarer result.
   */
  signAgreementWindow: number
  signDivergences: number
  signConvergences: number
  houseDivergences: number
  houseConvergences: number
  total: number
  /** True when houses could not be compared at all. */
  housesUndefined: boolean
  /** True when fewer than two systems are selected, so nothing can be compared. */
  tooFewSystems: boolean
}

const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
]
const ordinal = (house: number) => ORDINALS[house - 1] ?? String(house)

/** Join names as "A and B" or "A, B and C". */
function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function systemNameMap(systemIds: SystemId[]): Record<string, string> {
  return Object.fromEntries(systemIds.map((id) => [id, SYSTEMS[id].name]))
}

function compareSign(
  entries: { systemId: SystemId; placement: Placement }[],
  systemIds: SystemId[],
  widestZodiacGap: number,
  signAgreementWindow: number,
): SignComparison {
  const names = systemNameMap(systemIds)
  const distinct = new Set(entries.map((entry) => entry.placement.sign))

  if (distinct.size === 1) {
    const sign = entries[0].placement.sign
    const signName = entries[0].placement.signName
    const deepest = Math.max(...entries.map((entry) => entry.placement.degreeInSign))

    return {
      verdict: 'converge',
      distinctValues: 1,
      convergedSign: signName,
      associations: signAssociations(sign, systemIds, names),
      explanation:
        `${list(entries.map((entry) => SYSTEMS[entry.systemId].name))} all place `
        + `this in ${signName}. Their zodiacs begin up to `
        + `${formatDegrees(widestZodiacGap)} apart, so agreement here is not `
        + `automatic: it holds because the placement sits far enough into the `
        + `sign -- at most ${formatDegrees(deepest)} in -- that the offset `
        + `between the zodiacs does not carry it over a boundary. Only the `
        + `final ${formatDegrees(signAgreementWindow)} of a sign does that.`,
    }
  }

  const readings = entries
    .map((entry) => `${SYSTEMS[entry.systemId].shortName} reads `
      + `${entry.placement.signName} ${formatDegrees(entry.placement.degreeInSign)}`)
    .join('; ')

  return {
    verdict: 'diverge',
    distinctValues: distinct.size,
    convergedSign: null,
    associations: [],
    explanation:
      `${readings}. The position has not moved. The systems measure from `
      + `zodiac origins up to ${formatDegrees(widestZodiacGap)} apart, so the `
      + `same longitude falls in different signs.`,
  }
}

function houseCause(
  entries: { systemId: SystemId; placement: Placement }[],
  chart: Chart,
): HouseCause {
  // Whole sign counts signs from the Ascendant's sign, so when the ayanamsa
  // shifts a body and the Ascendant by the same number of signs it cancels out
  // of the count entirely. Work out whether it actually contributed here.
  const offsets = new Set<number>()

  for (const entry of entries) {
    const result = chart.systems[entry.systemId]
    const ascendant = result.ascendant
    if (!ascendant) continue
    offsets.add(
      norm360(signOf(entry.placement.longitude) * 30 - signOf(ascendant.longitude) * 30) / 30,
    )
  }

  return offsets.size > 1 ? 'ayanamsa-and-house-system' : 'house-system'
}

function compareHouse(
  point: PointId,
  entries: { systemId: SystemId; placement: Placement }[],
  systemIds: SystemId[],
  chart: Chart,
): HouseComparison {
  const names = systemNameMap(systemIds)
  const base = { convergedHouse: null, cause: null, associations: [] as Association[] }

  if (!chart.timeKnown) {
    return {
      ...base,
      verdict: 'undefined',
      distinctValues: 0,
      explanation:
        'Houses depend on the exact time and place of birth. Without a birth '
        + 'time no tradition can place this, so none is shown.',
    }
  }

  if (point === 'ascendant') {
    return {
      ...base,
      verdict: 'converge',
      distinctValues: 1,
      convergedHouse: 1,
      associations: houseAssociations(1, systemIds, names),
      explanation:
        'The Ascendant begins the first house in every one of these '
        + 'traditions, so the house cannot differ. The sign can, and when it '
        + 'does, every whole sign house shifts with it.',
    }
  }

  const known = entries.filter((entry) => entry.placement.house !== null)
  if (known.length < entries.length || known.length < 2) {
    const survivors = known
      .map((entry) => `${SYSTEMS[entry.systemId].shortName} places it in the `
        + `${ordinal(entry.placement.house!)}`)
      .join('; ')

    return {
      ...base,
      verdict: 'undefined',
      distinctValues: known.length,
      explanation:
        'Placidus house cusps are undefined at this latitude, so there is no '
        + 'Western house to compare. '
        + (survivors
          ? `${survivors}. Whole sign does not depend on latitude, so it `
            + 'survives where Placidus does not.'
          : ''),
    }
  }

  const distinct = new Set(known.map((entry) => entry.placement.house))

  if (distinct.size === 1) {
    const house = known[0].placement.house!
    return {
      verdict: 'converge',
      distinctValues: 1,
      convergedHouse: house,
      associations: houseAssociations(house, systemIds, names),
      cause: null,
      explanation:
        `${list(known.map((entry) => SYSTEMS[entry.systemId].name))} all place `
        + `this in the ${ordinal(house)} house, having drawn its boundaries `
        + `two different ways -- Placidus by unequal arcs that depend on the `
        + `time and latitude of birth, whole sign by giving each house one `
        + `entire sign. The agreement is arrived at independently.`,
    }
  }

  const cause = houseCause(known, chart)
  const readings = known
    .map((entry) => `${SYSTEMS[entry.systemId].shortName} the `
      + `${ordinal(entry.placement.house!)}`)
    .join(', ')

  return {
    ...base,
    verdict: 'diverge',
    distinctValues: distinct.size,
    cause,
    explanation: cause === 'ayanamsa-and-house-system'
      ? `${readings}. Two causes compound here. The house systems differ, and `
        + 'the ayanamsa moved this body and the Ascendant across a different '
        + 'number of sign boundaries, so the whole sign count starts from a '
        + 'different place. Usually that second effect cancels out. Here it '
        + 'does not.'
      : `${readings}. This is not the ayanamsa: it shifted this body and the `
        + 'Ascendant by the same number of signs, so it cancels out of the '
        + 'whole sign count. The difference is the house system alone. '
        + 'Placidus cuts unequal arcs that depend on the time and latitude of '
        + 'birth, so a body near a cusp can fall either side of it; whole sign '
        + 'assigns each house one entire sign, so only the sign matters.',
  }
}

/** Compare the selected systems of a computed chart, row by row. */
export function compareFrames(chart: Chart): Comparison {
  const systemIds = chart.systemIds
  const results = systemIds.map((id) => chart.systems[id]).filter(Boolean) as SystemResult[]

  const ayanamsas = systemIds.map((id) => ({
    systemId: id,
    systemName: SYSTEMS[id].name,
    degrees: chart.systems[id].ayanamsa,
    label: SYSTEMS[id].ayanamsaName ?? 'tropical',
  }))

  const origins = ayanamsas.map((entry) => entry.degrees)
  const widestZodiacGap = origins.length > 1
    ? Math.max(...origins) - Math.min(...origins)
    : 0
  const signAgreementWindow = 30 - widestZodiacGap

  const tooFewSystems = systemIds.length < 2

  const points: PointId[] = [
    ...(results[0]?.ascendant ? (['ascendant'] as PointId[]) : []),
    ...(results[0]?.placements.map((placement) => placement.point) ?? []),
  ]

  const rows: ComparisonRow[] = []

  for (const point of points) {
    const entries = systemIds
      .map((systemId) => ({ systemId, placement: placementOf(chart.systems[systemId], point) }))
      .filter((entry): entry is { systemId: SystemId; placement: Placement } =>
        entry.placement !== null)

    if (entries.length === 0) continue

    const sign = compareSign(entries, systemIds, widestZodiacGap, signAgreementWindow)
    const house = compareHouse(point, entries, systemIds, chart)

    rows.push({
      point,
      label: entries[0].placement.label,
      placements: systemIds.map((systemId) => ({
        systemId,
        systemName: SYSTEMS[systemId].name,
        placement: placementOf(chart.systems[systemId], point),
      })),
      sign,
      house,
      diverges: sign.verdict === 'diverge' || house.verdict === 'diverge',
      converges: sign.verdict === 'converge' || house.verdict === 'converge',
    })
  }

  const count = (axis: 'sign' | 'house', verdict: Verdict) =>
    rows.filter((row) => row[axis].verdict === verdict).length

  return {
    rows,
    systemIds,
    ayanamsas,
    widestZodiacGap,
    signAgreementWindow,
    signDivergences: count('sign', 'diverge'),
    signConvergences: count('sign', 'converge'),
    houseDivergences: count('house', 'diverge'),
    houseConvergences: count('house', 'converge'),
    total: rows.length,
    housesUndefined: rows.every((row) => row.house.verdict === 'undefined'),
    tooFewSystems,
  }
}

/**
 * The standing explanation of why the systems differ, independent of any
 * chart. Shown before results, so the comparison is legible when it arrives.
 */
export const FRAME_EXPLANATIONS = {
  ayanamsa:
    "The gap between two zodiacs is the ayanamsa. It exists because the "
    + "Earth's axis wobbles, completing one slow circle roughly every 25,800 "
    + 'years. The equinox drifts backwards through the constellations at about '
    + '50 arcseconds a year -- one degree every seventy-two years. The tropical '
    + 'and sidereal zodiacs last agreed somewhere around the fifth century. '
    + 'They are now about twenty-four degrees apart, which is most of a sign.',
  consequence:
    'Because the ayanamsa is nearly the width of a sign, most placements land '
    + 'in a different sign in the two traditions. A position keeps its sign '
    + 'only when it sits in the final few degrees of a tropical sign. Neither '
    + 'tradition has made an arithmetic error. They are measuring the same sky '
    + 'from two different starting points, and each is internally consistent.',
  convergence:
    'Where the systems agree, they have arrived at the same answer from '
    + 'different foundations -- a different zodiac origin, a different rule for '
    + 'dividing the sky. That is the rarer result and the stronger one. It is '
    + 'not a verdict about anything; it is a statement about the systems.',
  interpretive:
    'Both systems are interpretive frameworks with long histories of practice. '
    + 'Neither is evidence-based, and this tool takes no position on what any '
    + 'placement means. It shows where the frameworks describe the same sky '
    + 'differently, and where they do not.',
} as const
