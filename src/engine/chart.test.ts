/**
 * Engine verification.
 *
 * Failures report actual versus expected in degrees, because "expected 23.5,
 * got 23.51" is a rounding difference and "expected 23.5, got 26.9" is a
 * timezone bug, and a bare boolean cannot tell you which.
 */
import { describe, expect, it } from 'vitest'
import * as Astronomy from 'astronomy-engine'

import { type PointId, computeChart, houseFromCusps, wholeSignHouse } from './chart'
import { BODIES } from './ephemeris'
import { angularSeparation, degreeInSign, formatLongitude, norm360, signOf } from './signs'
import {
  ARCMINUTE_TOLERANCE, ASCENDANT_TOLERANCE, AYANAMSA_REFERENCES, AYANAMSA_TOLERANCE,
  REFERENCE_CHARTS, type ExpectedPoint,
} from './reference-charts'
import { lmtOffsetMinutes, resolveOffset, zoneOffsetMinutesAt, buddhistToCommonEra } from './time'

/** Report a comparison in degrees whether it passes or fails. */
function expectDegreesWithin(
  label: string,
  actual: number,
  expected: number,
  tolerance: number,
) {
  const delta = angularSeparation(actual, expected)
  const arcminutes = delta * 60

  expect(
    delta,
    `${label}\n`
    + `  expected ${formatLongitude(expected)}  (${expected.toFixed(4)} deg)\n`
    + `  actual   ${formatLongitude(actual)}  (${actual.toFixed(4)} deg)\n`
    + `  delta    ${delta.toFixed(4)} deg = ${arcminutes.toFixed(2)} arcmin\n`
    + `  allowed  ${(tolerance * 60).toFixed(2)} arcmin`,
  ).toBeLessThanOrEqual(tolerance)
}

function expectPoint(
  label: string,
  actualLongitude: number,
  expected: ExpectedPoint,
  tolerance: number,
) {
  // A sign boundary error is categorically worse than a degree of drift, so
  // it is asserted separately and first.
  const expectedSign = expected.sign
  const actualSign = formatLongitude(actualLongitude).split(' ')[0]
  expect(actualSign, `${label}: wrong sign (${actualSign}, expected ${expectedSign})`)
    .toBe(expectedSign)

  const signStart = signOf(actualLongitude) * 30
  expectDegreesWithin(label, actualLongitude, signStart + expected.degreeInSign, tolerance)
}

describe('sign arithmetic', () => {
  it('assigns a sign by its half-open interval, so 29.97 is not the next sign', () => {
    expect(signOf(0)).toBe(0)
    expect(signOf(29.97)).toBe(0)
    expect(signOf(29.999999)).toBe(0)
    expect(signOf(30)).toBe(1)
    expect(signOf(359.999)).toBe(11)
    expect(signOf(360)).toBe(0)
  })

  it('handles negative longitudes, which sidereal subtraction produces', () => {
    // Tropical Aries 10 minus a 24 degree ayanamsa lands in Pisces, not at -14.
    expect(norm360(10 - 24)).toBeCloseTo(346, 10)
    expect(signOf(10 - 24)).toBe(11)
    expect(degreeInSign(10 - 24)).toBeCloseTo(16, 10)
  })
})

describe('house assignment', () => {
  const evenCusps = Array.from({ length: 12 }, (_, i) => i * 30)

  it('places a longitude in the house whose interval contains it', () => {
    expect(houseFromCusps(0, evenCusps)).toBe(1)
    expect(houseFromCusps(29.99, evenCusps)).toBe(1)
    expect(houseFromCusps(30, evenCusps)).toBe(2)
    expect(houseFromCusps(359.99, evenCusps)).toBe(12)
  })

  it('handles unequal Placidus cusps that wrap through zero', () => {
    // Cusps from the Einstein chart, first house at Cancer 11.6.
    const cusps = [101.65, 118.62, 137.81, 162.84, 198.33, 243.11,
      281.65, 298.62, 317.81, 342.84, 18.33, 63.11]
    expect(houseFromCusps(105, cusps)).toBe(1)
    expect(houseFromCusps(0, cusps)).toBe(10)
    expect(houseFromCusps(20, cusps)).toBe(11)
    expect(houseFromCusps(100, cusps)).toBe(12)
  })

  it('is not the same rule as whole sign', () => {
    // An Ascendant late in a sign: whole sign puts the whole sign in house 1,
    // Placidus-style interval walking would not.
    const ascendant = 29.9 // Aries 29.9
    expect(wholeSignHouse(0.1, ascendant)).toBe(1) // Aries 0.1 -- same sign
    expect(wholeSignHouse(30.1, ascendant)).toBe(2) // Taurus -- next house
    expect(wholeSignHouse(ascendant, ascendant)).toBe(1)
  })
})

describe('timezone handling', () => {
  it('uses the offset in force on the date, not the current one', () => {
    // South Africa has been UTC+2 since 1903.
    expect(zoneOffsetMinutesAt(Date.UTC(1918, 6, 18), 'Africa/Johannesburg')).toBe(120)
    // Britain was on BST in July 1961.
    expect(zoneOffsetMinutesAt(Date.UTC(1961, 6, 1), 'Europe/London')).toBe(60)
    // and on GMT in January.
    expect(zoneOffsetMinutesAt(Date.UTC(1961, 0, 1), 'Europe/London')).toBe(0)
  })

  it('falls back to Local Mean Time from the birth longitude before standard time', () => {
    // Europe/Berlin in 1879 reports Berlin's own LMT, +53.5 minutes. A birth
    // in Ulm, 3.4 degrees west, is +40 minutes. Using the zone value would put
    // the Ascendant out by more than three degrees.
    const berlinLmt = zoneOffsetMinutesAt(Date.UTC(1879, 2, 14), 'Europe/Berlin')
    expect(berlinLmt).toBeGreaterThan(53)
    expect(berlinLmt).toBeLessThan(54)

    const resolved = resolveOffset(
      { year: 1879, month: 3, day: 14, hour: 11, minute: 30 },
      'Europe/Berlin',
      10.0,
    )
    expect(resolved.source).toBe('lmt')
    expect(resolved.offsetMinutes).toBeCloseTo(40, 6)
  })

  it('keeps Thailand at UTC+7 with no DST in the modern era', () => {
    const resolved = resolveOffset(
      { year: 1990, month: 6, day: 15, hour: 9, minute: 0 },
      'Asia/Bangkok',
      100.5,
    )
    expect(resolved.source).toBe('tzdb')
    expect(resolved.offsetMinutes).toBe(420)
    expect(resolved.label).toBe('UTC+07:00')
  })

  it('converts Buddhist Era years, which Thai birth records commonly use', () => {
    expect(buddhistToCommonEra(2533)).toBe(1990)
    expect(buddhistToCommonEra(2569)).toBe(2026)
  })

  it('derives LMT as four minutes per degree of longitude', () => {
    expect(lmtOffsetMinutes(15)).toBeCloseTo(60, 10)
    expect(lmtOffsetMinutes(-75)).toBeCloseTo(-300, 10)
    expect(lmtOffsetMinutes(10)).toBeCloseTo(40, 10)
  })
})

describe('Lahiri ayanamsa', () => {
  it.each(AYANAMSA_REFERENCES)(
    'matches the published value at $utcIso',
    async ({ utcIso, expectedDegrees }) => {
      const date = new Date(utcIso)
      const chart = await computeChart({
        local: {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate(),
          hour: 0,
          minute: 0,
        },
        timeKnown: true,
        latitude: 0,
        longitudeEast: 0,
        zone: 'UTC',
        manualOffsetMinutes: 0,
      })

      const delta = Math.abs(chart.ayanamsa - expectedDegrees)
      expect(
        delta,
        `ayanamsa at ${utcIso}\n`
        + `  expected ${expectedDegrees.toFixed(5)} deg\n`
        + `  actual   ${chart.ayanamsa.toFixed(5)} deg\n`
        + `  delta    ${(delta * 3600).toFixed(1)} arcsec`,
      ).toBeLessThanOrEqual(AYANAMSA_TOLERANCE)
    },
  )

  it('is date-dependent and drifts at roughly 50 arcseconds a year', async () => {
    const at = async (year: number) => (await computeChart({
      local: { year, month: 1, day: 1, hour: 0, minute: 0 },
      timeKnown: true,
      latitude: 0,
      longitudeEast: 0,
      zone: 'UTC',
      manualOffsetMinutes: 0,
    })).ayanamsa

    const drift = ((await at(2000)) - (await at(1900))) / 100 * 3600
    expect(drift).toBeGreaterThan(49)
    expect(drift).toBeLessThan(52)
  })
})

describe.each(REFERENCE_CHARTS)('reference chart: $name', (reference) => {
  it('converts to the correct UTC instant', async () => {
    const chart = await computeChart(reference.birth)
    expect(
      chart.utc.toISOString(),
      `timezone conversion for ${reference.name} (${chart.offset.label})`,
    ).toBe(reference.expectedUtcIso)
  })

  it('matches the published tropical Ascendant', async () => {
    const chart = await computeChart(reference.birth)
    const ascendant = chart.tropical.ascendant
    expect(ascendant).not.toBeNull()
    expectPoint(
      `${reference.name} tropical Ascendant`,
      ascendant!.longitude,
      reference.tropical.ascendant!,
      ASCENDANT_TOLERANCE,
    )
  })

  it.each(BODIES)('matches the published tropical %s', async (body) => {
    const chart = await computeChart(reference.birth)
    const placement = chart.tropical.placements.find((p) => p.point === body)!
    expectPoint(
      `${reference.name} tropical ${body}`,
      placement.longitude,
      reference.tropical[body],
      ARCMINUTE_TOLERANCE,
    )
  })

  it('derives the sidereal frame as tropical minus the ayanamsa, exactly', async () => {
    const chart = await computeChart(reference.birth)

    const points: PointId[] = [...BODIES, 'ascendant']
    for (const point of points) {
      const tropical = point === 'ascendant'
        ? chart.tropical.ascendant!
        : chart.tropical.placements.find((p) => p.point === point)!
      const sidereal = point === 'ascendant'
        ? chart.sidereal.ascendant!
        : chart.sidereal.placements.find((p) => p.point === point)!

      const difference = norm360(tropical.longitude - sidereal.longitude)
      expect(
        Math.abs(difference - chart.ayanamsa),
        `${point}: tropical minus sidereal should equal the ayanamsa exactly.\n`
        + `  ayanamsa   ${chart.ayanamsa.toFixed(6)} deg\n`
        + `  difference ${difference.toFixed(6)} deg\n`
        + '  A mismatch means positions were computed twice instead of once.',
      ).toBeLessThan(1e-9)
    }
  })

  it('agrees with astronomy-engine, an independent implementation', async () => {
    const chart = await computeChart(reference.birth)
    const time = new Astronomy.AstroTime(chart.utc)

    const names: Record<string, Astronomy.Body> = {
      sun: Astronomy.Body.Sun,
      moon: Astronomy.Body.Moon,
      mercury: Astronomy.Body.Mercury,
      venus: Astronomy.Body.Venus,
      mars: Astronomy.Body.Mars,
      jupiter: Astronomy.Body.Jupiter,
      saturn: Astronomy.Body.Saturn,
    }

    for (const body of BODIES) {
      const ours = chart.tropical.placements.find((p) => p.point === body)!.longitude
      const theirs = Astronomy.Ecliptic(
        Astronomy.GeoVector(names[body], time, true),
      ).elon

      const delta = angularSeparation(ours, theirs) * 3600
      expect(
        delta,
        `${body}: Swiss Ephemeris and astronomy-engine disagree by `
        + `${delta.toFixed(2)} arcsec (ours ${ours.toFixed(5)}, `
        + `theirs ${theirs.toFixed(5)})`,
      ).toBeLessThan(30)
    }
  })

  it('assigns every body a house in both systems', async () => {
    const chart = await computeChart(reference.birth)
    for (const frame of [chart.tropical, chart.sidereal]) {
      for (const placement of frame.placements) {
        expect(placement.house, `${frame.frame} ${placement.point}`)
          .toBeGreaterThanOrEqual(1)
        expect(placement.house, `${frame.frame} ${placement.point}`)
          .toBeLessThanOrEqual(12)
      }
      expect(frame.ascendant!.house).toBe(1)
    }
  })

  it('puts the Vedic Ascendant at the start of the first whole sign house', async () => {
    const chart = await computeChart(reference.birth)
    const ascendant = chart.sidereal.ascendant!
    expect(chart.sidereal.cusps![0]).toBeCloseTo(signOf(ascendant.longitude) * 30, 9)
    // Every whole sign cusp is a sign boundary. Placidus cusps are not.
    for (const cusp of chart.sidereal.cusps!) {
      expect(cusp % 30).toBeCloseTo(0, 9)
    }
  })
})

describe('honest degradation', () => {
  const bangkok = {
    local: { year: 1990, month: 6, day: 15, hour: 9, minute: 30 },
    latitude: 13.7563,
    longitudeEast: 100.5018,
    zone: 'Asia/Bangkok',
  }

  it('withholds the Ascendant and all houses when the birth time is unknown', async () => {
    const chart = await computeChart({ ...bangkok, timeKnown: false })

    expect(chart.tropical.ascendant).toBeNull()
    expect(chart.sidereal.ascendant).toBeNull()
    expect(chart.tropical.cusps).toBeNull()
    expect(chart.sidereal.cusps).toBeNull()

    for (const frame of [chart.tropical, chart.sidereal]) {
      for (const placement of frame.placements) {
        expect(placement.house, `${frame.frame} ${placement.point}`).toBeNull()
      }
    }

    expect(chart.notes.join(' ')).toMatch(/birth time unknown/i)
  })

  it('still reports sign placements when the birth time is unknown', async () => {
    const chart = await computeChart({ ...bangkok, timeKnown: false })
    expect(chart.tropical.placements).toHaveLength(BODIES.length)
    expect(chart.tropical.placements.every((p) => p.signName.length > 0)).toBe(true)
  })

  it('withholds Placidus houses inside the polar circles rather than inventing them', async () => {
    const chart = await computeChart({
      local: { year: 1990, month: 6, day: 21, hour: 12, minute: 0 },
      timeKnown: true,
      latitude: 69.65, // Tromso
      longitudeEast: 18.96,
      zone: 'Europe/Oslo',
    })

    expect(chart.placidusDefined).toBe(false)
    expect(chart.tropical.cusps).toBeNull()
    expect(chart.tropical.placements.every((p) => p.house === null)).toBe(true)
    expect(chart.notes.join(' ')).toMatch(/polar circles/i)

    // Whole sign does not depend on latitude, so the Vedic side survives.
    expect(chart.sidereal.cusps).not.toBeNull()
    expect(chart.sidereal.placements.every((p) => p.house !== null)).toBe(true)
  })

  it('reports retrograde motion as a display property, not a position error', async () => {
    // Mercury was retrograde in mid-March 1879.
    const chart = await computeChart(REFERENCE_CHARTS[0].birth)
    const tropicalMercury = chart.tropical.placements.find((p) => p.point === 'mercury')!
    const siderealMercury = chart.sidereal.placements.find((p) => p.point === 'mercury')!
    // Whatever it is, both frames must agree -- retrogradation is not
    // frame-dependent.
    expect(tropicalMercury.retrograde).toBe(siderealMercury.retrograde)
  })
})
