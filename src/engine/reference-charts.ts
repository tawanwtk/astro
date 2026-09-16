/**
 * Published reference charts used to verify the engine.
 *
 * Every expected value here was taken from a published chart, not from this
 * engine's own output -- otherwise the tests would only prove the code agrees
 * with itself. Sources are named per chart.
 *
 * Published charts quote positions to the arcminute, so the tolerances below
 * are set just above rounding, not loosened until the tests pass.
 */
import type { BirthData } from './chart'

export interface ExpectedPoint {
  /** Sign name as published. */
  sign: string
  /** Degrees within the sign, as published, in decimal degrees. */
  degreeInSign: number
}

export interface ReferenceChart {
  name: string
  source: string
  /** What this chart is here to catch that the others do not. */
  tests: string
  birth: BirthData
  /** Expected UTC instant, so a timezone error fails loudly and separately. */
  expectedUtcIso: string
  tropical: {
    ascendant?: ExpectedPoint
    midheaven?: ExpectedPoint
    sun: ExpectedPoint
    moon: ExpectedPoint
    mercury: ExpectedPoint
    venus: ExpectedPoint
    mars: ExpectedPoint
    jupiter: ExpectedPoint
    saturn: ExpectedPoint
  }
}

/** Published to the arcminute, so allow a little over one arcminute. */
export const ARCMINUTE_TOLERANCE = 1.5 / 60

/**
 * TECHNICAL.md permits an Ascendant within a degree. With Swiss Ephemeris the
 * expected error is arcseconds, so a whole degree of drift would indicate a
 * real bug in time handling rather than acceptable imprecision. The tighter
 * bound is deliberate.
 */
export const ASCENDANT_TOLERANCE = 3 / 60

export const REFERENCE_CHARTS: ReferenceChart[] = [
  {
    name: 'Albert Einstein',
    source:
      'Astro-Databank (Rodden AA, birth record); positions cross-checked '
      + 'against Astrotheme. Ulm 48N24 10E00, 14 March 1879, 11:30 LMT.',
    tests:
      'Northern hemisphere, and a birth predating standard time -- the offset '
      + 'must come from the birth longitude as Local Mean Time, not from the '
      + "tz database's reference city.",
    birth: {
      local: { year: 1879, month: 3, day: 14, hour: 11, minute: 30 },
      timeKnown: true,
      latitude: 48.4,
      longitudeEast: 10.0,
      zone: 'Europe/Berlin',
    },
    // 11:30 LMT at 10E00 is 11:30 minus 40 minutes.
    expectedUtcIso: '1879-03-14T10:50:00.000Z',
    tropical: {
      ascendant: { sign: 'Cancer', degreeInSign: 11 + 38 / 60 },
      midheaven: { sign: 'Pisces', degreeInSign: 12 + 50 / 60 },
      sun: { sign: 'Pisces', degreeInSign: 23 + 30 / 60 },
      moon: { sign: 'Sagittarius', degreeInSign: 14 + 32 / 60 },
      mercury: { sign: 'Aries', degreeInSign: 3 + 9 / 60 },
      venus: { sign: 'Aries', degreeInSign: 16 + 59 / 60 },
      mars: { sign: 'Capricorn', degreeInSign: 26 + 55 / 60 },
      jupiter: { sign: 'Aquarius', degreeInSign: 27 + 29 / 60 },
      saturn: { sign: 'Aries', degreeInSign: 4 + 11 / 60 },
    },
  },
  {
    name: 'Nelson Mandela',
    source:
      'Astrotheme, contributed by Frances McEvoy. Mvezo 31S58 28E30, '
      + '18 July 1918, 14:54 SAST.',
    tests:
      'Southern hemisphere. A latitude sign-convention error survives every '
      + 'northern chart and fails here immediately, because the Ascendant '
      + 'depends on the sign of the latitude.',
    birth: {
      local: { year: 1918, month: 7, day: 18, hour: 14, minute: 54 },
      timeKnown: true,
      latitude: -31 - 58 / 60,
      longitudeEast: 28.5,
      zone: 'Africa/Johannesburg',
    },
    // South Africa has been UTC+2 since 1903, with no DST in 1918.
    expectedUtcIso: '1918-07-18T12:54:00.000Z',
    tropical: {
      ascendant: { sign: 'Sagittarius', degreeInSign: 23 + 41 / 60 },
      midheaven: { sign: 'Virgo', degreeInSign: 5 + 44 / 60 },
      sun: { sign: 'Cancer', degreeInSign: 25 + 4 / 60 },
      moon: { sign: 'Scorpio', degreeInSign: 20 + 15 / 60 },
      mercury: { sign: 'Leo', degreeInSign: 16 + 8 / 60 },
      venus: { sign: 'Gemini', degreeInSign: 22 + 35 / 60 },
      mars: { sign: 'Libra', degreeInSign: 12 + 35 / 60 },
      jupiter: { sign: 'Cancer', degreeInSign: 1 + 10 / 60 },
      saturn: { sign: 'Leo', degreeInSign: 15 + 2 / 60 },
    },
  },
]

/**
 * Published Lahiri ayanamsa values, for verifying the sidereal frame directly
 * rather than only through its consequences.
 *
 * Source: Lahiri (Chitrapaksha) ayanamsa tables as implemented by Swiss
 * Ephemeris and reproduced in Jagannatha Hora reference tables.
 *
 * Tolerance is one arcminute. Published tables differ from each other by of
 * the order of ten arcseconds depending on whether nutation in longitude is
 * included, which is far below anything that could move a sign boundary.
 */
export const AYANAMSA_REFERENCES = [
  { utcIso: '1900-01-01T00:00:00Z', expectedDegrees: 22 + 27 / 60 + 38 / 3600 },
  { utcIso: '1950-01-01T00:00:00Z', expectedDegrees: 23 + 9 / 60 + 31 / 3600 },
  { utcIso: '2000-01-01T00:00:00Z', expectedDegrees: 23 + 51 / 60 + 12 / 3600 },
]

export const AYANAMSA_TOLERANCE = 1 / 60
