/**
 * Thin wrapper over the bundled Swiss Ephemeris WebAssembly build.
 *
 * Everything here is offline. The .wasm and .data files are bundled and served
 * from our own origin; no ephemeris is ever fetched from a third party.
 *
 * This module deliberately exposes only the tropical frame. The sidereal frame
 * is not a second computation -- see chart.ts.
 */
import SwissEph from 'swisseph-wasm'

export const BODIES = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
] as const

export type Body = (typeof BODIES)[number]

const SE_BODY_ID: Record<Body, number> = {
  sun: 0, moon: 1, mercury: 2, venus: 3, mars: 4, jupiter: 5, saturn: 6,
}

export const BODY_LABEL: Record<Body, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
}

/** Swiss Ephemeris mode plus speed, so retrograde can be read off. */
const CALC_FLAGS = 2 /* SEFLG_SWIEPH */ | 256 /* SEFLG_SPEED */

/**
 * Placidus is undefined where a house cusp never rises. Swiss Ephemeris
 * silently substitutes Porphyry beyond the polar circles rather than failing,
 * which is exactly the kind of quiet wrongness this project must not ship, so
 * we detect the condition ourselves and say so.
 */
export const PLACIDUS_LATITUDE_LIMIT = 66.0

export interface RawPosition {
  /** Geocentric apparent ecliptic longitude, tropical frame, degrees. */
  longitude: number
  /** Ecliptic latitude, degrees. */
  latitude: number
  /** Longitude per day. Negative means retrograde. */
  speed: number
}

export interface RawHouses {
  /** Twelve cusp longitudes, index 0 = first house. Tropical frame. */
  cusps: number[]
  /** Tropical ascendant. */
  ascendant: number
  /** Tropical midheaven. */
  midheaven: number
}

let instance: SwissEph | null = null
let initPromise: Promise<SwissEph> | null = null

/** Load and initialise the wasm module once. Safe to call concurrently. */
export async function loadEphemeris(): Promise<SwissEph> {
  if (instance) return instance
  if (!initPromise) {
    initPromise = (async () => {
      const swe = new SwissEph()
      await swe.initSwissEph()
      instance = swe
      return swe
    })()
  }
  return initPromise
}

/** Julian Day (UT) for a UTC instant. Fractional hours, not truncated days. */
export function julianDay(swe: SwissEph, utc: Date): number {
  const fractionalHour =
    utc.getUTCHours()
    + utc.getUTCMinutes() / 60
    + utc.getUTCSeconds() / 3600
    + utc.getUTCMilliseconds() / 3_600_000

  return swe.julday(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
    fractionalHour,
  )
}

/** Geocentric tropical position of one body. */
export function positionOf(swe: SwissEph, jd: number, body: Body): RawPosition {
  const result = swe.calc_ut(jd, SE_BODY_ID[body], CALC_FLAGS)
  return { longitude: result[0], latitude: result[1], speed: result[3] }
}

/**
 * Ayanamsa for the instant in a given sidereal mode, in degrees.
 *
 * Date-dependent and never hardcoded: Lahiri is roughly 22.2 degrees in 1879
 * and 24.2 today, drifting about 50 arcseconds a year with the precession of
 * the equinoxes. For a system whose only difference from the tropical frame is
 * its zodiac origin, this single number is that entire difference.
 *
 * The mode must be set immediately before reading, because the library keeps
 * it as global state.
 */
export function ayanamsaFor(swe: SwissEph, jd: number, sidMode: number): number {
  swe.set_sid_mode(sidMode, 0, 0)
  return swe.get_ayanamsa_ut(jd)
}

/** Lahiri, the Vedic default. Kept for the tests that check it by name. */
export function ayanamsaAt(swe: SwissEph, jd: number): number {
  return ayanamsaFor(swe, jd, 1)
}

/** Tropical Placidus cusps, ascendant and midheaven. */
export function placidusHouses(
  swe: SwissEph,
  jd: number,
  latitude: number,
  longitudeEast: number,
): RawHouses {
  // Swiss Ephemeris takes geographic longitude east-positive, matching our
  // own convention. Checked against the reference charts rather than assumed.
  const result = swe.houses(jd, latitude, longitudeEast, 'P')

  return {
    cusps: Array.from({ length: 12 }, (_, i) => result.cusps[i + 1]),
    ascendant: result.ascmc[0],
    midheaven: result.ascmc[1],
  }
}

/** Whether Placidus is meaningful at this latitude. */
export function placidusIsDefined(latitude: number): boolean {
  return Math.abs(latitude) < PLACIDUS_LATITUDE_LIMIT
}
