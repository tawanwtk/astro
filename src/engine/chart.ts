/**
 * The single computation.
 *
 * Positions are computed once, in the tropical frame. Both traditions read
 * from that one computation:
 *
 *   Western tropical  -- the longitude, used directly.
 *   Vedic sidereal    -- the same longitude minus the ayanamsa.
 *
 * Nothing is computed twice. If the two frames ever disagree about something
 * that is not the ayanamsa or the house system, that is a bug in this file and
 * not a difference between the traditions.
 */
import {
  type Body, BODIES, BODY_LABEL, type RawHouses,
  ayanamsaAt, julianDay, loadEphemeris, placidusHouses, placidusIsDefined,
  positionOf,
} from './ephemeris'
import {
  type SignIndex, type SignName, SIGNS,
  degreeInSign, formatDegrees, norm360, signOf,
} from './signs'
import {
  type LocalDateTime, type ResolvedOffset,
  manualOffset, resolveOffset, toUtc,
} from './time'

export type Frame = 'tropical' | 'sidereal'
export type HouseSystem = 'placidus' | 'whole-sign'
export type PointId = Body | 'ascendant'

export interface BirthData {
  local: LocalDateTime
  /**
   * False when the birth time is unknown. The Ascendant and every house
   * placement are then genuinely undefined and are reported as such -- we do
   * not quietly default to noon and present the result as if it were real.
   */
  timeKnown: boolean
  /** North positive. */
  latitude: number
  /** East positive. West longitudes are negative. */
  longitudeEast: number
  /** IANA zone, e.g. `Asia/Bangkok`. */
  zone: string
  /** Overrides the zone lookup when the user insists on an explicit offset. */
  manualOffsetMinutes?: number
}

export interface Placement {
  point: PointId
  label: string
  /** Ecliptic longitude in this frame, degrees. */
  longitude: number
  sign: SignIndex
  signName: SignName
  degreeInSign: number
  /** e.g. Pisces 23 degrees 30 minutes, pre-formatted for display. */
  formatted: string
  /** Display property, not a position error. Never true for the Ascendant. */
  retrograde: boolean
  /** 1-12, or null when the birth time is unknown. */
  house: number | null
}

export interface FrameResult {
  frame: Frame
  houseSystem: HouseSystem
  placements: Placement[]
  /** Null when the birth time is unknown. */
  ascendant: Placement | null
  /** Twelve cusp longitudes in this frame, or null when unavailable. */
  cusps: number[] | null
}

export interface Chart {
  birth: BirthData
  offset: ResolvedOffset
  utc: Date
  julianDay: number
  /** Lahiri ayanamsa for the instant, degrees. The whole difference in one number. */
  ayanamsa: number
  timeKnown: boolean
  /** False above the polar circles, where Placidus cusps are undefined. */
  placidusDefined: boolean
  tropical: FrameResult
  sidereal: FrameResult
  /** Honest caveats for the reader: LMT conversion, unknown time, polar latitude. */
  notes: string[]
}

/**
 * House containing a longitude, given twelve cusps in the same frame.
 *
 * Cusps are in ascending zodiacal order but wrap through 0 degrees, and
 * Placidus houses are unequal, so this walks the intervals rather than
 * dividing by 30.
 */
export function houseFromCusps(longitude: number, cusps: number[]): number {
  const target = norm360(longitude)

  for (let i = 0; i < 12; i++) {
    const start = norm360(cusps[i])
    const end = norm360(cusps[(i + 1) % 12])
    const span = norm360(end - start)
    const offsetIntoHouse = norm360(target - start)
    if (offsetIntoHouse < span) return i + 1
  }

  // Unreachable for well-formed cusps; returning the first house would be a
  // silent lie, so fail loudly instead.
  throw new Error(`No house contains longitude ${longitude}`)
}

/**
 * Whole sign house: the Ascendant's sign is the whole of the first house, and
 * each following sign is the next house. This is not Placidus with rounding --
 * it is a different rule, and conflating the two is the classic error.
 */
export function wholeSignHouse(longitude: number, ascendantLongitude: number): number {
  return norm360(signOf(longitude) * 30 - signOf(ascendantLongitude) * 30) / 30 + 1
}

/** Twelve whole-sign cusps: the Ascendant's sign start, then every 30 degrees. */
export function wholeSignCusps(ascendantLongitude: number): number[] {
  const firstCusp = signOf(ascendantLongitude) * 30
  return Array.from({ length: 12 }, (_, i) => norm360(firstCusp + i * 30))
}

function makePlacement(
  point: PointId,
  label: string,
  longitude: number,
  speed: number,
  house: number | null,
): Placement {
  const normalised = norm360(longitude)
  const sign = signOf(normalised)

  return {
    point,
    label,
    longitude: normalised,
    sign,
    signName: SIGNS[sign],
    degreeInSign: degreeInSign(normalised),
    formatted: `${SIGNS[sign]} ${formatDegrees(degreeInSign(normalised))}`,
    retrograde: speed < 0,
    house,
  }
}

function buildFrame(
  frame: Frame,
  houseSystem: HouseSystem,
  /** Tropical longitudes and speeds, straight from the one computation. */
  tropicalPositions: Map<Body, { longitude: number; speed: number }>,
  /** Degrees to subtract from every tropical longitude. Zero for tropical. */
  ayanamsaShift: number,
  houses: RawHouses | null,
  timeKnown: boolean,
  placidusDefined: boolean,
): FrameResult {
  const shift = (longitude: number) => norm360(longitude - ayanamsaShift)

  const ascendantLongitude = houses && timeKnown ? shift(houses.ascendant) : null

  let cusps: number[] | null = null
  if (ascendantLongitude !== null) {
    if (houseSystem === 'whole-sign') {
      cusps = wholeSignCusps(ascendantLongitude)
    } else if (houses && placidusDefined) {
      cusps = houses.cusps.map(shift)
    }
  }

  const houseOf = (longitude: number): number | null => {
    if (ascendantLongitude === null) return null
    if (houseSystem === 'whole-sign') return wholeSignHouse(longitude, ascendantLongitude)
    return cusps ? houseFromCusps(longitude, cusps) : null
  }

  const placements = BODIES.map((body) => {
    const raw = tropicalPositions.get(body)!
    const longitude = shift(raw.longitude)
    return makePlacement(body, BODY_LABEL[body], longitude, raw.speed, houseOf(longitude))
  })

  const ascendant =
    ascendantLongitude === null
      ? null
      : makePlacement('ascendant', 'Ascendant', ascendantLongitude, 0, 1)

  return { frame, houseSystem, placements, ascendant, cusps }
}

/** Compute both frames from one set of birth data. */
export async function computeChart(birth: BirthData): Promise<Chart> {
  const swe = await loadEphemeris()
  const notes: string[] = []

  // An unknown birth time still needs *some* instant to place the slow bodies.
  // We use noon local, and the honesty is in what we refuse to report from it:
  // no Ascendant, no houses, in either tradition.
  const local: LocalDateTime = birth.timeKnown
    ? birth.local
    : { ...birth.local, hour: 12, minute: 0 }

  const offset =
    birth.manualOffsetMinutes !== undefined
      ? manualOffset(birth.manualOffsetMinutes)
      : resolveOffset(local, birth.zone, birth.longitudeEast)

  if (offset.source === 'lmt') {
    notes.push(
      'This birth predates standard time at this location, so the time was '
      + 'read as Local Mean Time and converted from the birth longitude.',
    )
  }

  if (!birth.timeKnown) {
    notes.push(
      'Birth time unknown. The Ascendant and all house placements are '
      + 'undefined and are not shown. The Moon may also be uncertain, as it '
      + 'moves about half a degree an hour.',
    )
  }

  const utc = toUtc(local, offset)
  const jd = julianDay(swe, utc)
  const ayanamsa = ayanamsaAt(swe, jd)

  const placidusDefined = placidusIsDefined(birth.latitude)
  if (birth.timeKnown && !placidusDefined) {
    notes.push(
      'This latitude lies inside the polar circles, where Placidus house '
      + 'cusps are undefined -- some cusps never rise. Western house '
      + 'placements are withheld rather than approximated. The Vedic whole '
      + 'sign houses are unaffected, because they do not depend on latitude.',
    )
  }

  // The one computation. Everything below reads from this.
  const tropicalPositions = new Map<Body, { longitude: number; speed: number }>()
  for (const body of BODIES) {
    const position = positionOf(swe, jd, body)
    tropicalPositions.set(body, { longitude: position.longitude, speed: position.speed })
  }

  const houses = birth.timeKnown
    ? placidusHouses(swe, jd, birth.latitude, birth.longitudeEast)
    : null

  return {
    birth,
    offset,
    utc,
    julianDay: jd,
    ayanamsa,
    timeKnown: birth.timeKnown,
    placidusDefined,
    tropical: buildFrame(
      'tropical', 'placidus', tropicalPositions, 0, houses, birth.timeKnown, placidusDefined,
    ),
    sidereal: buildFrame(
      'sidereal', 'whole-sign', tropicalPositions, ayanamsa, houses, birth.timeKnown, true,
    ),
    notes,
  }
}
