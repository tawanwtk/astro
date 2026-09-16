/**
 * Where the two traditions disagree, and why.
 *
 * This is the product. Not the placements -- the gap between them.
 *
 * There are exactly two independent ways a row can diverge, and they have
 * different causes, so they are computed and explained separately:
 *
 *   Sign   -- caused by the ayanamsa. The two frames disagree about where the
 *             zodiac starts, so the same longitude falls in different signs.
 *
 *   House  -- caused mainly by the house system, Placidus against whole sign,
 *             and only sometimes by the ayanamsa as well. This distinction is
 *             the non-obvious part and is worked out below.
 *
 * Everything here describes systems. Nothing here describes a person, predicts
 * anything, or offers advice.
 */
import type { Chart, Placement, PointId } from './chart'
import { formatDegrees, norm360, signOf } from './signs'

export type Verdict = 'agree' | 'diverge' | 'undefined'

export type HouseCause =
  /** The two house systems carve the same sky differently. */
  | 'house-system'
  /**
   * The ayanamsa moved the body and the Ascendant by different numbers of
   * signs, so the whole sign count starts from a different place.
   */
  | 'ayanamsa-and-house-system'

export interface SignComparison {
  verdict: Exclude<Verdict, 'undefined'>
  /** How many signs the sidereal placement sits behind the tropical one. */
  signsBack: number
  explanation: string
}

export interface HouseComparison {
  verdict: Verdict
  cause: HouseCause | null
  explanation: string
}

export interface DivergenceRow {
  point: PointId
  label: string
  tropical: Placement
  sidereal: Placement
  sign: SignComparison
  house: HouseComparison
  /** True when either axis disagrees. Drives the marker in the table. */
  diverges: boolean
}

export interface Divergence {
  rows: DivergenceRow[]
  ayanamsa: number
  /** e.g. `24°13'13"`. */
  ayanamsaFormatted: string
  /**
   * The width of the window in which the two traditions agree about the sign.
   *
   * A body keeps its sign only if it sits further into that sign than the
   * ayanamsa -- that is, in the final `30 - ayanamsa` degrees. Today that
   * window is under six degrees wide, which is why agreement is the rare case
   * and disagreement the norm.
   */
  agreementWindowDegrees: number
  signDivergences: number
  houseDivergences: number
  /** Rows compared. */
  total: number
  /** True when houses could not be compared at all. */
  housesUndefined: boolean
}

/** Ordinal for prose: 1 -> "first". */
const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
]

function ordinal(house: number): string {
  return ORDINALS[house - 1] ?? String(house)
}

function compareSign(
  tropical: Placement,
  sidereal: Placement,
  ayanamsaFormatted: string,
  agreementWindowDegrees: number,
): SignComparison {
  const signsBack = norm360(signOf(tropical.longitude) * 30 - signOf(sidereal.longitude) * 30) / 30

  if (signsBack === 0) {
    return {
      verdict: 'agree',
      signsBack: 0,
      explanation:
        `Both traditions read this as ${tropical.signName}. That is the less `
        + `common outcome: it holds only for a position in the last `
        + `${formatDegrees(agreementWindowDegrees)} of a tropical sign, where `
        + `subtracting the ayanamsa of ${ayanamsaFormatted} is not enough to `
        + `cross the boundary. Here the position is `
        + `${formatDegrees(tropical.degreeInSign)} into ${tropical.signName}, `
        + `which clears it.`,
    }
  }

  return {
    verdict: 'diverge',
    signsBack,
    explanation:
      `Western tropical reads ${tropical.signName} `
      + `${formatDegrees(tropical.degreeInSign)}. Vedic sidereal measures from `
      + `a zodiac that starts ${ayanamsaFormatted} earlier, which puts the same `
      + `longitude at ${sidereal.signName} `
      + `${formatDegrees(sidereal.degreeInSign)}. The position has not moved. `
      + `The two traditions are counting from different starting points.`,
  }
}

function compareHouse(
  tropical: Placement,
  sidereal: Placement,
  tropicalAscendant: Placement | null,
  siderealAscendant: Placement | null,
  placidusDefined: boolean,
  timeKnown: boolean,
): HouseComparison {
  if (!timeKnown) {
    return {
      verdict: 'undefined',
      cause: null,
      explanation:
        'Houses depend on the exact time and place of birth. Without a birth '
        + 'time neither tradition can place this, so neither is shown.',
    }
  }

  if (!placidusDefined || tropical.house === null) {
    return {
      verdict: 'undefined',
      cause: null,
      explanation:
        'Placidus house cusps are undefined at this latitude, so there is no '
        + 'Western house placement to compare. The Vedic whole sign house is '
        + `the ${ordinal(sidereal.house!)}; whole sign does not depend on `
        + 'latitude, so it survives where Placidus does not.',
    }
  }

  if (!tropicalAscendant || !siderealAscendant || sidereal.house === null) {
    return { verdict: 'undefined', cause: null, explanation: 'Houses unavailable.' }
  }

  // Whole sign counts signs from the Ascendant's sign. Placidus counts unequal
  // arcs from the Ascendant's exact degree. If the ayanamsa shifts the body
  // and the Ascendant by the same number of signs, the shift cancels out of
  // the whole sign count entirely -- which is why most house divergence is not
  // the ayanamsa's doing at all.
  const tropicalSignOffset =
    norm360(signOf(tropical.longitude) * 30 - signOf(tropicalAscendant.longitude) * 30) / 30
  const siderealSignOffset =
    norm360(signOf(sidereal.longitude) * 30 - signOf(siderealAscendant.longitude) * 30) / 30
  const ayanamsaContributed = tropicalSignOffset !== siderealSignOffset

  if (tropical.house === sidereal.house) {
    return {
      verdict: 'agree',
      cause: null,
      explanation:
        `Both traditions place this in the ${ordinal(tropical.house)} house, `
        + 'though they draw its boundaries differently: Placidus divides the '
        + 'sky by unequal arcs that depend on the time and latitude of birth, '
        + 'whole sign gives each house one entire sign. The agreement is real '
        + 'but it is arrived at two different ways.',
    }
  }

  if (ayanamsaContributed) {
    return {
      verdict: 'diverge',
      cause: 'ayanamsa-and-house-system',
      explanation:
        `Western Placidus places this in the ${ordinal(tropical.house)} house, `
        + `Vedic whole sign in the ${ordinal(sidereal.house)}. Two causes `
        + 'compound here. The house systems differ, and the ayanamsa moved '
        + 'this body and the Ascendant across a different number of sign '
        + 'boundaries, so the whole sign count starts from a different place. '
        + 'Usually that second effect cancels out. Here it does not.',
    }
  }

  return {
    verdict: 'diverge',
    cause: 'house-system',
    explanation:
      `Western Placidus places this in the ${ordinal(tropical.house)} house, `
      + `Vedic whole sign in the ${ordinal(sidereal.house)}. This is not the `
      + 'ayanamsa: it shifted this body and the Ascendant by the same number '
      + 'of signs, so it cancels out of the whole sign count. The difference '
      + 'is the house system alone. Placidus cuts unequal arcs that depend on '
      + 'the time and latitude of birth, so a body near a cusp can fall either '
      + 'side of it; whole sign assigns each house one entire sign, so only '
      + 'the sign matters.',
  }
}

/** Compare the two frames of a computed chart, row by row. */
export function compareFrames(chart: Chart): Divergence {
  const ayanamsaFormatted = formatDegrees(chart.ayanamsa)
  const agreementWindowDegrees = 30 - chart.ayanamsa

  const points: PointId[] = [
    ...(chart.tropical.ascendant ? (['ascendant'] as PointId[]) : []),
    ...chart.tropical.placements.map((placement) => placement.point),
  ]

  const rows: DivergenceRow[] = []

  for (const point of points) {
    const tropical = point === 'ascendant'
      ? chart.tropical.ascendant
      : chart.tropical.placements.find((placement) => placement.point === point)
    const sidereal = point === 'ascendant'
      ? chart.sidereal.ascendant
      : chart.sidereal.placements.find((placement) => placement.point === point)

    if (!tropical || !sidereal) continue

    const sign = compareSign(tropical, sidereal, ayanamsaFormatted, agreementWindowDegrees)

    // The Ascendant is the first house in both traditions by definition, so
    // there is no house comparison to make. Its sign divergence is the
    // consequential one: it is what the entire Vedic house frame is built on.
    const house: HouseComparison = point === 'ascendant'
      ? {
        verdict: chart.timeKnown ? 'agree' : 'undefined',
        cause: null,
        explanation: chart.timeKnown
          ? 'The Ascendant begins the first house in both traditions, so the '
          + 'house cannot differ. The sign can, and when it does every Vedic '
          + 'whole sign house shifts with it -- one ayanamsa subtraction '
          + 'rearranges the entire Vedic chart.'
          : 'Without a birth time there is no Ascendant.',
      }
      : compareHouse(
        tropical, sidereal,
        chart.tropical.ascendant, chart.sidereal.ascendant,
        chart.placidusDefined, chart.timeKnown,
      )

    rows.push({
      point,
      label: tropical.label,
      tropical,
      sidereal,
      sign,
      house,
      diverges: sign.verdict === 'diverge' || house.verdict === 'diverge',
    })
  }

  return {
    rows,
    ayanamsa: chart.ayanamsa,
    ayanamsaFormatted,
    agreementWindowDegrees,
    signDivergences: rows.filter((row) => row.sign.verdict === 'diverge').length,
    houseDivergences: rows.filter((row) => row.house.verdict === 'diverge').length,
    total: rows.length,
    housesUndefined: rows.every((row) => row.house.verdict === 'undefined'),
  }
}

/**
 * The standing explanation of why the two traditions differ, independent of
 * any chart. Shown before results, so the comparison is legible when it
 * arrives rather than surprising.
 */
export const FRAME_EXPLANATIONS = {
  tropical: {
    name: 'Western tropical',
    zodiac:
      'The tropical zodiac is tied to the seasons. Zero degrees Aries is '
      + 'defined as the March equinox -- the moment the Sun crosses the '
      + 'celestial equator going north. The zodiac is anchored to the '
      + "Earth's relationship with the Sun, not to the stars.",
    houses:
      'Placidus divides the sky by unequal arcs, based on the time it takes '
      + 'each degree of the ecliptic to rise. House sizes depend on the exact '
      + 'time and the latitude of birth, and the system breaks down entirely '
      + 'near the poles, where some degrees never rise at all.',
  },
  sidereal: {
    name: 'Vedic sidereal',
    zodiac:
      'The sidereal zodiac is tied to the stars. It keeps zero degrees Aries '
      + 'fixed against a stellar reference rather than against the equinox. '
      + 'Since the two definitions coincided, they have drifted apart.',
    houses:
      'Whole sign gives each house one entire sign. The sign rising at birth '
      + 'is the whole of the first house, the next sign the second, and so on. '
      + 'House boundaries and sign boundaries are the same thing, so latitude '
      + 'does not enter into it.',
  },
  ayanamsa:
    "The gap between the two zodiacs is the ayanamsa. It exists because the "
    + "Earth's axis wobbles, completing one slow circle roughly every 25,800 "
    + 'years. The equinox drifts backwards through the constellations at about '
    + '50 arcseconds a year -- one degree every seventy-two years. The two '
    + 'zodiacs last agreed somewhere around the fifth century. They are now '
    + 'about twenty-four degrees apart, which is most of a sign.',
  consequence:
    'Because the ayanamsa is nearly the width of a sign, most placements land '
    + 'in a different sign in the two traditions. A position keeps its sign '
    + 'only when it sits in the final few degrees of a tropical sign. Neither '
    + 'tradition has made an arithmetic error. They are measuring the same sky '
    + 'from two different starting points, and each is internally consistent.',
  interpretive:
    'Both systems are interpretive frameworks with long histories of practice. '
    + 'Neither is evidence-based, and this tool takes no position on what any '
    + 'placement means. It shows where the two frameworks describe the same '
    + 'sky differently.',
} as const
