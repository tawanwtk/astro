/**
 * The divergence logic is the product, so its claims are tested as claims --
 * not just that it produces a string, but that the reasoning it states is
 * actually true of the chart it is describing.
 */
import { describe, expect, it } from 'vitest'

import { computeChart } from './chart'
import { compareFrames } from './divergence'
import { signOf } from './signs'
import { REFERENCE_CHARTS } from './reference-charts'

const EINSTEIN = REFERENCE_CHARTS[0].birth
const MANDELA = REFERENCE_CHARTS[1].birth

describe('sign divergence', () => {
  it('diverges exactly when the tropical degree is less than the ayanamsa', async () => {
    const divergence = compareFrames(await computeChart(EINSTEIN))

    for (const row of divergence.rows) {
      const withinAyanamsaOfSignStart = row.tropical.degreeInSign < divergence.ayanamsa
      expect(
        row.sign.verdict === 'diverge',
        `${row.label}: tropical at ${row.tropical.degreeInSign.toFixed(3)} deg `
        + `into ${row.tropical.signName}, ayanamsa ${divergence.ayanamsa.toFixed(3)} deg. `
        + `Expected sign divergence to be ${withinAyanamsaOfSignStart}.`,
      ).toBe(withinAyanamsaOfSignStart)
    }
  })

  it('reports the sidereal placement exactly one sign back, never more', async () => {
    // The ayanamsa is under 30 degrees, so it can never skip a whole sign.
    for (const birth of [EINSTEIN, MANDELA]) {
      const divergence = compareFrames(await computeChart(birth))
      expect(divergence.ayanamsa).toBeLessThan(30)
      for (const row of divergence.rows) {
        expect([0, 1]).toContain(row.sign.signsBack)
      }
    }
  })

  it('states an agreement window that matches where agreement actually occurs', async () => {
    const divergence = compareFrames(await computeChart(MANDELA))
    expect(divergence.agreementWindowDegrees).toBeCloseTo(30 - divergence.ayanamsa, 9)

    for (const row of divergence.rows) {
      const inWindow = row.tropical.degreeInSign >= divergence.ayanamsa
      expect(row.sign.verdict === 'agree', `${row.label}`).toBe(inWindow)
    }
  })
})

describe('house divergence', () => {
  it('attributes a house difference to the ayanamsa only when it really contributed', async () => {
    const divergence = compareFrames(await computeChart(MANDELA))
    const chart = await computeChart(MANDELA)

    const tropicalAscSign = signOf(chart.tropical.ascendant!.longitude)
    const siderealAscSign = signOf(chart.sidereal.ascendant!.longitude)

    for (const row of divergence.rows) {
      if (row.point === 'ascendant' || row.house.verdict !== 'diverge') continue

      const tropicalOffset = (signOf(row.tropical.longitude) - tropicalAscSign + 12) % 12
      const siderealOffset = (signOf(row.sidereal.longitude) - siderealAscSign + 12) % 12
      const ayanamsaContributed = tropicalOffset !== siderealOffset

      expect(
        row.house.cause,
        `${row.label}: tropical sign offset from Asc ${tropicalOffset}, `
        + `sidereal ${siderealOffset}. The explanation must not blame the `
        + 'ayanamsa for a difference it did not cause.',
      ).toBe(ayanamsaContributed ? 'ayanamsa-and-house-system' : 'house-system')
    }
  })

  it('identifies a house difference the ayanamsa had nothing to do with', async () => {
    // Bangkok, 1 January 1930, midnight. Venus, Mars and Saturn all sit in the
    // first few degrees of tropical Capricorn, just past a Placidus cusp that
    // whole sign puts elsewhere. The ayanamsa shifts each of them and the
    // Ascendant by one sign alike, so it cancels out of the whole sign count
    // and the difference is the house system alone.
    //
    // Across a 300-chart sweep this pure house-system case outnumbers the
    // ayanamsa-compounded one roughly two to one, so it is the ordinary
    // reason the two traditions disagree about houses -- not the exotic one.
    const divergence = compareFrames(await computeChart({
      local: { year: 1930, month: 1, day: 1, hour: 0, minute: 0 },
      timeKnown: true,
      latitude: 13.7563,
      longitudeEast: 100.5018,
      zone: 'Asia/Bangkok',
    }))

    const venus = divergence.rows.find((row) => row.point === 'venus')!
    expect(venus.house.verdict).toBe('diverge')
    expect(venus.house.cause).toBe('house-system')
    expect(venus.house.explanation).toMatch(/This is not the ayanamsa/)
    expect(venus.tropical.house).toBe(3)
    expect(venus.sidereal.house).toBe(4)
  })

  it('confirms the whole sign house is the sign offset from the sidereal Ascendant', async () => {
    const chart = await computeChart(MANDELA)
    const ascendantSign = signOf(chart.sidereal.ascendant!.longitude)

    for (const placement of chart.sidereal.placements) {
      const expected = ((signOf(placement.longitude) - ascendantSign + 12) % 12) + 1
      expect(placement.house, placement.label).toBe(expected)
    }
  })

  it('never claims a house divergence for the Ascendant, which begins house one in both', async () => {
    const divergence = compareFrames(await computeChart(EINSTEIN))
    const ascendant = divergence.rows.find((row) => row.point === 'ascendant')!
    expect(ascendant.house.verdict).toBe('agree')
    expect(ascendant.tropical.house).toBe(1)
    expect(ascendant.sidereal.house).toBe(1)
  })
})

describe('divergence marking', () => {
  it('marks a row when either axis disagrees', async () => {
    const divergence = compareFrames(await computeChart(EINSTEIN))
    for (const row of divergence.rows) {
      expect(row.diverges, row.label)
        .toBe(row.sign.verdict === 'diverge' || row.house.verdict === 'diverge')
    }
  })

  it('counts what it marks', async () => {
    const divergence = compareFrames(await computeChart(MANDELA))
    expect(divergence.total).toBe(divergence.rows.length)
    expect(divergence.signDivergences)
      .toBe(divergence.rows.filter((r) => r.sign.verdict === 'diverge').length)
    expect(divergence.houseDivergences)
      .toBe(divergence.rows.filter((r) => r.house.verdict === 'diverge').length)
  })

  it('finds both agreement and disagreement in a real chart, not all of one', async () => {
    // A comparison tool that marked every row, or none, would be useless.
    const divergence = compareFrames(await computeChart(EINSTEIN))
    expect(divergence.signDivergences).toBeGreaterThan(0)
    expect(divergence.signDivergences).toBeLessThan(divergence.total)
  })
})

describe('honest degradation in the comparison', () => {
  it('reports houses as undefined, not as agreeing, when the time is unknown', async () => {
    const divergence = compareFrames(await computeChart({ ...EINSTEIN, timeKnown: false }))

    expect(divergence.housesUndefined).toBe(true)
    expect(divergence.houseDivergences).toBe(0)
    for (const row of divergence.rows) {
      expect(row.house.verdict, row.label).toBe('undefined')
    }
    // Sign comparison still works without a birth time.
    expect(divergence.rows.length).toBeGreaterThan(0)
    expect(divergence.rows.some((row) => row.sign.verdict === 'diverge')).toBe(true)
  })

  it('does not include an Ascendant row when there is no birth time', async () => {
    const divergence = compareFrames(await computeChart({ ...EINSTEIN, timeKnown: false }))
    expect(divergence.rows.some((row) => row.point === 'ascendant')).toBe(false)
  })

  it('explains the polar case without inventing a Western house', async () => {
    const divergence = compareFrames(await computeChart({
      local: { year: 1990, month: 6, day: 21, hour: 12, minute: 0 },
      timeKnown: true,
      latitude: 69.65,
      longitudeEast: 18.96,
      zone: 'Europe/Oslo',
    }))

    const bodies = divergence.rows.filter((row) => row.point !== 'ascendant')
    for (const row of bodies) {
      expect(row.house.verdict, row.label).toBe('undefined')
      expect(row.house.explanation).toMatch(/Placidus house cusps are undefined/)
      // The Vedic side is still reported, because whole sign does not care
      // about latitude.
      expect(row.sidereal.house).not.toBeNull()
    }
  })
})

describe('framing', () => {
  it('describes systems, never people, and makes no prediction', async () => {
    const divergence = compareFrames(await computeChart(EINSTEIN))
    const prose = divergence.rows
      .flatMap((row) => [row.sign.explanation, row.house.explanation])
      .join(' ')

    // Copy describes traditions, not people. These are the words that would
    // mean the tool had started making claims about a reader.
    for (const forbidden of [
      /\byou\b/i, /\byour\b/i, /\bpersonality\b/i, /\bwill\b/i,
      /\bdestiny\b/i, /\bfate\b/i, /\bshould\b/i, /\bpredict/i,
    ]) {
      expect(prose, `divergence copy matched ${forbidden}`).not.toMatch(forbidden)
    }
  })
})
