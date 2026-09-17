/**
 * The readings are the part of this project most likely to drift into the
 * thing the brief forbids, so they are tested harder than they are written.
 *
 * Three things are checked:
 *
 *   1. Framing. No second person, no prediction, no advice, no claim about a
 *      person -- over the fixed tables *and* over everything assembled from
 *      them for real charts. The generated text is where a safe table and a
 *      safe template can still combine into an unsafe sentence.
 *   2. Dignity. The tables are the astrology, so they are checked against the
 *      doctrine directly, including the three places the two traditions
 *      genuinely disagree about a degree they both inherited.
 *   3. Assembly. Every reading is traceable to its lookups, and a tradition is
 *      never handed a category it does not use.
 */
import { describe, expect, it } from 'vitest'

import { computeChart } from './chart'
import { compareFrames } from './divergence'
import { dignityOf } from './dignity'
import { REFERENCE_CHARTS } from './reference-charts'
import {
  allReadingTables, allReadingText, buildReadings,
} from './readings'
import { SIGNS } from './signs'

const EINSTEIN = REFERENCE_CHARTS[0].birth
const MANDELA = REFERENCE_CHARTS[1].birth

const sign = (name: (typeof SIGNS)[number]) => SIGNS.indexOf(name) as 0

async function readingsFor(birth: typeof EINSTEIN) {
  const chart = await computeChart(birth)
  return { chart, readings: buildReadings(compareFrames(chart)) }
}

describe('framing', () => {
  /*
   * The same list divergence.test.ts enforces on the association text. It is
   * duplicated deliberately: if someone relaxes it in one place to get a
   * phrasing through, the other test should still fail.
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

  it.each(FORBIDDEN)('the fixed tables never match %s (%s)', (pattern, reason) => {
    expect(allReadingTables(), `reading tables matched ${reason}`).not.toMatch(pattern)
  })

  it('assembled readings never address or describe a reader', async () => {
    // Several charts, so the templates are exercised with and without houses
    // and across many dignity branches.
    const births = [EINSTEIN, MANDELA, { ...EINSTEIN, timeKnown: false }]

    for (const birth of births) {
      const chart = await computeChart(birth)
      const prose = allReadingText(compareFrames(chart))

      for (const [pattern, reason] of FORBIDDEN) {
        expect(prose, `generated reading matched ${pattern} (${reason})`)
          .not.toMatch(pattern)
      }
    }
  })

  it('attributes every reading to a named tradition', async () => {
    const { readings } = await readingsFor(EINSTEIN)

    for (const body of readings) {
      for (const reading of body.readings) {
        // Nothing may read as a bare truth claim. Each reading carries the
        // tradition it came out of, and that is rendered next to it.
        expect(reading.attribution.length, `${body.label}/${reading.systemId}`)
          .toBeGreaterThan(20)
        expect(reading.systemName).toBeTruthy()
      }
    }
  })
})

describe('essential dignity', () => {
  it('places the classical exaltations', () => {
    // Doctrine both traditions share. Sign only -- the degrees differ and are
    // checked separately below.
    const shared: [Parameters<typeof dignityOf>[1], (typeof SIGNS)[number]][] = [
      ['sun', 'Aries'],
      ['moon', 'Taurus'],
      ['mercury', 'Virgo'],
      ['venus', 'Pisces'],
      ['mars', 'Capricorn'],
      ['jupiter', 'Cancer'],
      ['saturn', 'Libra'],
    ]

    for (const [body, signName] of shared) {
      for (const system of ['western', 'vedic'] as const) {
        const finding = dignityOf(system, body, sign(signName), 15)
        expect(finding?.kind, `${system} ${body} in ${signName}`).toBe('exaltation')
      }
    }
  })

  it('reads fall as the sign opposite the exaltation', () => {
    expect(dignityOf('western', 'sun', sign('Libra'), 15)?.kind).toBe('fall')
    expect(dignityOf('vedic', 'sun', sign('Libra'), 15)?.term).toBe('nīca')
  })

  it('disagrees about the exact degree for exactly the Sun, Jupiter and Saturn', () => {
    // This is the finding worth surfacing: the traditions inherited the same
    // exaltations and kept different degrees for three of them. If a table
    // edit ever makes the two agree everywhere, that is a lost distinction,
    // not a fix -- so the disagreement is asserted, not merely tolerated.
    const cases: [Parameters<typeof dignityOf>[1], (typeof SIGNS)[number], number, number][] = [
      ['sun', 'Aries', 19, 10],
      ['jupiter', 'Cancer', 15, 5],
      ['saturn', 'Libra', 21, 20],
    ]

    for (const [body, signName, west, vedic] of cases) {
      expect(dignityOf('western', body, sign(signName), 1)?.exactDegree).toBe(west)
      expect(dignityOf('vedic', body, sign(signName), 1)?.exactDegree).toBe(vedic)
    }

    // And agrees about the other four.
    for (const [body, signName] of [
      ['moon', 'Taurus'], ['mercury', 'Virgo'],
      ['venus', 'Pisces'], ['mars', 'Capricorn'],
    ] as [Parameters<typeof dignityOf>[1], (typeof SIGNS)[number]][]) {
      const west = dignityOf('western', body, sign(signName), 1)?.exactDegree
      const vedic = dignityOf('vedic', body, sign(signName), 1)?.exactDegree
      expect(west, `${body} exaltation degree`).toBe(vedic)
    }
  })

  it('gives detriment to Western doctrine only', () => {
    // Mars rules Aries, so Libra is its detriment in Western terms. Jyotisa
    // has no such category and must report none here rather than inventing
    // an equivalent.
    expect(dignityOf('western', 'mars', sign('Libra'), 15)?.kind).toBe('detriment')
    expect(dignityOf('vedic', 'mars', sign('Libra'), 15)).toBeNull()
  })

  it('gives mulatrikona to Jyotisa only, and only inside the degree band', () => {
    // Sun: mulatrikona in Leo 0-20, own sign beyond it.
    expect(dignityOf('vedic', 'sun', sign('Leo'), 10)?.kind).toBe('mulatrikona')
    expect(dignityOf('vedic', 'sun', sign('Leo'), 25)?.kind).toBe('domicile')
    // Western has one category for the whole sign, at every degree.
    expect(dignityOf('western', 'sun', sign('Leo'), 10)?.kind).toBe('domicile')
    expect(dignityOf('western', 'sun', sign('Leo'), 25)?.kind).toBe('domicile')
  })

  it('reports no dignity where the tradition assigns none', () => {
    // The Sun in Gemini holds no essential dignity in either scheme.
    expect(dignityOf('western', 'sun', sign('Gemini'), 15)).toBeNull()
    expect(dignityOf('vedic', 'sun', sign('Gemini'), 15)).toBeNull()
  })
})

describe('assembly', () => {
  it('covers every compared body once per selected tradition', async () => {
    const { chart, readings } = await readingsFor(EINSTEIN)

    expect(readings.length).toBe(compareFrames(chart).rows.length)
    for (const body of readings) {
      expect(body.readings.map((reading) => reading.systemId))
        .toEqual(chart.systemIds)
    }
  })

  it('shows the lookups behind every reading', async () => {
    const { readings } = await readingsFor(EINSTEIN)

    for (const body of readings) {
      for (const reading of body.readings) {
        const sources = reading.strands.map((strand) => strand.source)
        // Body and sign always; dignity only where the tradition assigns one;
        // house only where the birth time made one definable.
        expect(sources, `${body.label}/${reading.systemId}`).toContain('planet')
        expect(sources).toContain('sign')
        expect(sources.includes('dignity')).toBe(reading.dignity !== null)
        expect(sources.includes('house')).toBe(reading.house !== null)

        for (const strand of reading.strands) {
          expect(strand.text.length, `empty ${strand.source} strand`).toBeGreaterThan(20)
        }
      }
    }
  })

  it('names each body and sign in the tradition being quoted', async () => {
    const { readings } = await readingsFor(EINSTEIN)
    const sun = readings.find((body) => body.point === 'sun')!

    const western = sun.readings.find((reading) => reading.systemId === 'western')!
    const vedic = sun.readings.find((reading) => reading.systemId === 'vedic')!

    expect(western.bodyName).toBe('The Sun')
    expect(vedic.bodyName).toBe('Sūrya')
    // The Sanskrit rasi names are the point of the exercise; a Western sign
    // name leaking into the Jyotisa column would flatten the difference the
    // section exists to show.
    expect(SIGNS).toContain(western.signName)
    expect(SIGNS).not.toContain(vedic.signName)
  })

  it('drops houses entirely when the birth time is unknown', async () => {
    const { readings } = await readingsFor({ ...EINSTEIN, timeKnown: false })

    for (const body of readings) {
      for (const reading of body.readings) {
        expect(reading.house).toBeNull()
        expect(reading.headline).not.toMatch(/house|bhāva/)
        expect(reading.strands.map((strand) => strand.source)).not.toContain('house')
      }
    }
  })

  it('reads a convergent placement in two different vocabularies', async () => {
    // The payoff the section exists for. Where the traditions agree on the
    // sign, the readings must still differ -- if they ever came out identical
    // the comparison would be showing nothing.
    const { readings } = await readingsFor(MANDELA)
    const convergent = readings.filter((body) => body.signConverges)

    expect(convergent.length, 'no convergent placement in the fixture chart')
      .toBeGreaterThan(0)

    for (const body of convergent) {
      const [first, second] = body.readings
      expect(first.signName).not.toBe(second.signName) // same rasi, different name
      expect(first.headline).not.toBe(second.headline)
      expect(first.strands[0].text).not.toBe(second.strands[0].text)
    }
  })
})
