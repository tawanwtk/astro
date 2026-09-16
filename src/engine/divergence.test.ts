/**
 * The comparison logic is the product, so its claims are tested as claims --
 * not that it produces a string, but that the reasoning it states is actually
 * true of the chart it describes.
 */
import { describe, expect, it } from 'vitest'

import { computeChart, placementOf } from './chart'
import { compareFrames } from './divergence'
import { allAssociationText } from './associations'
import { signOf } from './signs'
import { SYSTEM_IDS } from './systems'
import { REFERENCE_CHARTS } from './reference-charts'

const EINSTEIN = REFERENCE_CHARTS[0].birth
const MANDELA = REFERENCE_CHARTS[1].birth

const BANGKOK = {
  local: { year: 1990, month: 6, day: 15, hour: 9, minute: 30 },
  timeKnown: true,
  latitude: 13.7563,
  longitudeEast: 100.5018,
  zone: 'Asia/Bangkok',
}

describe('sign axis', () => {
  it('diverges exactly when the tropical degree is less than the zodiac gap', async () => {
    const chart = await computeChart(EINSTEIN)
    const comparison = compareFrames(chart)

    for (const row of comparison.rows) {
      const western = row.placements.find((entry) => entry.systemId === 'western')!.placement!
      const withinGapOfSignStart = western.degreeInSign < comparison.widestZodiacGap

      expect(
        row.sign.verdict === 'diverge',
        `${row.label}: Western at ${western.degreeInSign.toFixed(3)} deg into `
        + `${western.signName}, widest zodiac gap ${comparison.widestZodiacGap.toFixed(3)} deg. `
        + `Expected sign divergence to be ${withinGapOfSignStart}.`,
      ).toBe(withinGapOfSignStart)
    }
  })

  it('converges exactly when every system lands in the same sign', async () => {
    const comparison = compareFrames(await computeChart(MANDELA))

    for (const row of comparison.rows) {
      const signs = new Set(
        row.placements.map((entry) => entry.placement?.signName).filter(Boolean),
      )
      expect(row.sign.verdict === 'converge', row.label).toBe(signs.size === 1)
      if (row.sign.verdict === 'converge') {
        expect(row.sign.convergedSign).toBe([...signs][0])
      } else {
        expect(row.sign.convergedSign).toBeNull()
      }
    }
  })

  it('states an agreement window that matches where agreement actually occurs', async () => {
    const comparison = compareFrames(await computeChart(MANDELA))
    expect(comparison.signAgreementWindow)
      .toBeCloseTo(30 - comparison.widestZodiacGap, 9)

    for (const row of comparison.rows) {
      const western = row.placements.find((entry) => entry.systemId === 'western')!.placement!
      const inWindow = western.degreeInSign >= comparison.widestZodiacGap
      expect(row.sign.verdict === 'converge', row.label).toBe(inWindow)
    }
  })
})

describe('house axis', () => {
  it('attributes a house difference to the ayanamsa only when it really contributed', async () => {
    const chart = await computeChart(MANDELA)
    const comparison = compareFrames(chart)

    for (const row of comparison.rows) {
      if (row.point === 'ascendant' || row.house.verdict !== 'diverge') continue

      const offsets = new Set(
        row.placements.map(({ systemId, placement }) => {
          const ascendant = chart.systems[systemId].ascendant!
          return (signOf(placement!.longitude) - signOf(ascendant.longitude) + 12) % 12
        }),
      )

      expect(
        row.house.cause,
        `${row.label}: sign offsets from the Ascendant across systems are `
        + `${[...offsets].join(', ')}. The explanation must not blame the `
        + 'ayanamsa for a difference it did not cause.',
      ).toBe(offsets.size > 1 ? 'ayanamsa-and-house-system' : 'house-system')
    }
  })

  it('identifies a house difference the ayanamsa had nothing to do with', async () => {
    // Bangkok, 1 January 1930, midnight. Venus sits in the first few degrees
    // of tropical Capricorn, just past a Placidus cusp that whole sign puts
    // elsewhere. The ayanamsa shifts it and the Ascendant alike, so it cancels
    // out of the whole sign count and the difference is the house system alone.
    const comparison = compareFrames(await computeChart({
      ...BANGKOK,
      local: { year: 1930, month: 1, day: 1, hour: 0, minute: 0 },
    }))

    const venus = comparison.rows.find((row) => row.point === 'venus')!
    expect(venus.house.verdict).toBe('diverge')
    expect(venus.house.cause).toBe('house-system')
    expect(venus.house.explanation).toMatch(/This is not the ayanamsa/)
  })

  it('treats the Ascendant as converging, since it opens house one everywhere', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN))
    const ascendant = comparison.rows.find((row) => row.point === 'ascendant')!
    expect(ascendant.house.verdict).toBe('converge')
    expect(ascendant.house.convergedHouse).toBe(1)
    for (const entry of ascendant.placements) {
      expect(entry.placement!.house).toBe(1)
    }
  })

  it('converges exactly when every system lands in the same house', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN))

    for (const row of comparison.rows) {
      if (row.point === 'ascendant' || row.house.verdict === 'undefined') continue
      const houses = new Set(row.placements.map((entry) => entry.placement?.house))
      expect(row.house.verdict === 'converge', row.label).toBe(houses.size === 1)
      if (row.house.verdict === 'converge') {
        expect(row.house.convergedHouse).toBe([...houses][0])
      }
    }
  })
})

describe('both findings are reported', () => {
  it('marks each row by what each axis actually did', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN))
    for (const row of comparison.rows) {
      expect(row.diverges, row.label)
        .toBe(row.sign.verdict === 'diverge' || row.house.verdict === 'diverge')
      expect(row.converges, row.label)
        .toBe(row.sign.verdict === 'converge' || row.house.verdict === 'converge')
    }
  })

  it('allows a row to both converge and diverge, on different axes', async () => {
    // Einstein's Mars keeps its sign across both systems but changes house.
    // A model that forced one verdict per row would have to lie about one axis.
    const comparison = compareFrames(await computeChart(EINSTEIN))
    const mars = comparison.rows.find((row) => row.point === 'mars')!
    expect(mars.sign.verdict).toBe('converge')
    expect(mars.house.verdict).toBe('diverge')
    expect(mars.converges).toBe(true)
    expect(mars.diverges).toBe(true)
  })

  it('counts what it marks', async () => {
    const comparison = compareFrames(await computeChart(MANDELA))
    const count = (axis: 'sign' | 'house', verdict: string) =>
      comparison.rows.filter((row) => row[axis].verdict === verdict).length

    expect(comparison.total).toBe(comparison.rows.length)
    expect(comparison.signDivergences).toBe(count('sign', 'diverge'))
    expect(comparison.signConvergences).toBe(count('sign', 'converge'))
    expect(comparison.houseDivergences).toBe(count('house', 'diverge'))
    expect(comparison.houseConvergences).toBe(count('house', 'converge'))
  })

  it('finds both agreement and disagreement in a real chart, not all of one', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN))
    expect(comparison.signDivergences).toBeGreaterThan(0)
    expect(comparison.signConvergences).toBeGreaterThan(0)
  })
})

describe('system selection', () => {
  it('compares only the selected systems', async () => {
    const chart = await computeChart(EINSTEIN, ['western'])
    const comparison = compareFrames(chart)

    expect(comparison.systemIds).toEqual(['western'])
    expect(comparison.tooFewSystems).toBe(true)
    for (const row of comparison.rows) {
      expect(row.placements).toHaveLength(1)
    }
  })

  it('reports a zero zodiac gap when one system is selected', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN, ['vedic']))
    expect(comparison.widestZodiacGap).toBe(0)
    // With nothing to compare against, everything trivially agrees.
    expect(comparison.signDivergences).toBe(0)
  })

  it('measures the zodiac gap between the selected systems, not a constant', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN, [...SYSTEM_IDS]))
    const chart = await computeChart(EINSTEIN)
    expect(comparison.widestZodiacGap)
      .toBeCloseTo(chart.systems.vedic.ayanamsa - chart.systems.western.ayanamsa, 9)
  })

  it('gives the same result whichever order the systems are selected in', async () => {
    const forward = compareFrames(await computeChart(MANDELA, ['western', 'vedic']))
    const reverse = compareFrames(await computeChart(MANDELA, ['vedic', 'western']))

    expect(reverse.signDivergences).toBe(forward.signDivergences)
    expect(reverse.signConvergences).toBe(forward.signConvergences)
    expect(reverse.houseDivergences).toBe(forward.houseDivergences)
  })
})

describe('associations', () => {
  it('attaches associations only where systems converge', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN))

    for (const row of comparison.rows) {
      if (row.sign.verdict === 'converge') {
        expect(row.sign.associations.length, `${row.label} sign`)
          .toBe(comparison.systemIds.length)
      } else {
        expect(row.sign.associations, `${row.label} sign`).toEqual([])
      }

      if (row.house.verdict === 'converge') {
        expect(row.house.associations.length, `${row.label} house`)
          .toBe(comparison.systemIds.length)
      } else {
        expect(row.house.associations, `${row.label} house`).toEqual([])
      }
    }
  })

  it('attributes every association to the tradition it came from', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN))

    for (const row of comparison.rows) {
      for (const association of [...row.sign.associations, ...row.house.associations]) {
        expect(comparison.systemIds).toContain(association.systemId)
        expect(association.systemName.length).toBeGreaterThan(0)
        expect(association.text.length).toBeGreaterThan(20)
      }
    }
  })

  it('gives each tradition its own wording, not one shared blurb', async () => {
    const comparison = compareFrames(await computeChart(EINSTEIN))
    const converged = comparison.rows.find((row) => row.sign.verdict === 'converge')!
    const texts = converged.sign.associations.map((association) => association.text)
    expect(new Set(texts).size).toBe(texts.length)
  })
})

describe('framing', () => {
  /*
   * PROJECT_BRIEF.md: no personality descriptions, no predictions, no advice.
   * Copy describes traditions, not people. These patterns are the ways that
   * rule actually gets broken, so they are enforced rather than trusted -- and
   * they run over the association text too, which is where the temptation to
   * write "you are" is strongest.
   */
  const FORBIDDEN: [RegExp, string][] = [
    [/\byou\b/i, 'second person'],
    [/\byour\b/i, 'second person'],
    [/\byou're\b/i, 'second person'],
    [/\bpersonality\b/i, 'personality claim'],
    [/\bdestiny\b/i, 'prediction'],
    [/\bfate\b/i, 'prediction'],
    [/\bpredict/i, 'prediction'],
    [/\bwill (?:be|have|bring|make|find|feel|tend)\b/i, 'prediction'],
    [/\byou should\b/i, 'advice'],
    [/\bnative\b/i, 'claim about a person'],
    [/\bindicates that (?:the )?(?:person|native|individual)\b/i, 'claim about a person'],
    [/\b(?:lucky|unlucky|auspicious for you|good for you)\b/i, 'evaluative claim'],
  ]

  it('never addresses or describes a reader in the association text', () => {
    const prose = allAssociationText()
    for (const [pattern, reason] of FORBIDDEN) {
      expect(prose, `association text matched ${pattern} (${reason})`).not.toMatch(pattern)
    }
  })

  it('never addresses or describes a reader in the generated explanations', async () => {
    for (const birth of [EINSTEIN, MANDELA, { ...EINSTEIN, timeKnown: false }]) {
      const comparison = compareFrames(await computeChart(birth))
      const prose = comparison.rows
        .flatMap((row) => [row.sign.explanation, row.house.explanation])
        .join(' ')

      for (const [pattern, reason] of FORBIDDEN) {
        expect(prose, `explanation matched ${pattern} (${reason})`).not.toMatch(pattern)
      }
    }
  })

  it('names the tradition in every association, so nothing reads as fact', () => {
    const prose = allAssociationText()
    // Each entry should sit inside an attributed structure; the systemName is
    // supplied separately, but the text itself must not assert bare truth
    // about a person either.
    expect(prose).not.toMatch(/\bmeans that\b/i)
    expect(prose.length).toBeGreaterThan(1000)
  })
})

describe('honest degradation in the comparison', () => {
  it('reports houses as undefined, not as agreeing, when the time is unknown', async () => {
    const comparison = compareFrames(await computeChart({ ...EINSTEIN, timeKnown: false }))

    expect(comparison.housesUndefined).toBe(true)
    expect(comparison.houseDivergences).toBe(0)
    expect(comparison.houseConvergences).toBe(0)
    for (const row of comparison.rows) {
      expect(row.house.verdict, row.label).toBe('undefined')
      expect(row.house.associations, row.label).toEqual([])
    }
    // The sign axis still works without a birth time.
    expect(comparison.rows.some((row) => row.sign.verdict === 'diverge')).toBe(true)
  })

  it('does not include an Ascendant row when there is no birth time', async () => {
    const comparison = compareFrames(await computeChart({ ...EINSTEIN, timeKnown: false }))
    expect(comparison.rows.some((row) => row.point === 'ascendant')).toBe(false)
  })

  it('explains the polar case without inventing a Western house', async () => {
    const comparison = compareFrames(await computeChart({
      local: { year: 1990, month: 6, day: 21, hour: 12, minute: 0 },
      timeKnown: true,
      latitude: 69.65,
      longitudeEast: 18.96,
      zone: 'Europe/Oslo',
    }))

    const bodies = comparison.rows.filter((row) => row.point !== 'ascendant')
    for (const row of bodies) {
      expect(row.house.verdict, row.label).toBe('undefined')
      expect(row.house.explanation).toMatch(/Placidus house cusps are undefined/)
      // The Vedic side is still reported: whole sign ignores latitude.
      const vedic = row.placements.find((entry) => entry.systemId === 'vedic')!
      expect(vedic.placement!.house).not.toBeNull()
    }
  })
})

describe('the single computation still holds across systems', () => {
  it('derives every sidereal system as tropical minus its own ayanamsa, exactly', async () => {
    const chart = await computeChart(MANDELA)
    const western = chart.systems.western

    for (const id of chart.systemIds) {
      const result = chart.systems[id]
      for (const body of result.placements) {
        const tropical = placementOf(western, body.point)!
        const difference = ((tropical.longitude - body.longitude) % 360 + 360) % 360
        expect(
          Math.abs(difference - result.ayanamsa),
          `${id} ${body.point}: tropical minus this system should equal its `
          + `ayanamsa exactly.\n  ayanamsa ${result.ayanamsa.toFixed(6)}\n`
          + `  difference ${difference.toFixed(6)}\n`
          + '  A mismatch means positions were computed twice instead of once.',
        ).toBeLessThan(1e-9)
      }
    }
  })
})
