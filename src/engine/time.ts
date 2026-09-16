/**
 * Birth time -> UTC.
 *
 * TECHNICAL.md calls this the main source of wrong charts, and it is. Birth
 * time is always local time at the place of birth, and it must be converted
 * using the offset in force *on that date at that location*, not the current
 * offset and not the viewer's.
 *
 * Offsets come from the IANA tz database that ships inside every browser and
 * Node build via `Intl`, so this stays fully offline. No network, no bundled
 * tz data of our own.
 */

/** How a birth time was converted to UTC. Surfaced in the UI, not hidden. */
export type OffsetSource =
  /** IANA zone rules for that date -- standard time or a historical DST rule. */
  | 'tzdb'
  /** Local Mean Time from the birth longitude, before standard time existed. */
  | 'lmt'
  /** The user typed an offset and we used it verbatim. */
  | 'manual'

export interface ResolvedOffset {
  /** Minutes to ADD to local time to get UTC is the negation of this. */
  offsetMinutes: number
  source: OffsetSource
  /** Human-readable, e.g. `UTC+07:00` or `LMT +06:42 (from longitude)`. */
  label: string
}

export interface LocalDateTime {
  year: number
  /** 1-12. */
  month: number
  day: number
  hour: number
  minute: number
}

/**
 * Zone offset in minutes at a given instant, east positive.
 *
 * Works by formatting the instant in the target zone and reading the wall
 * clock back, which is the only offset API `Intl` actually exposes.
 */
export function zoneOffsetMinutesAt(utcMillis: number, zone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    era: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const parts: Record<string, string> = {}
  for (const part of dtf.formatToParts(new Date(utcMillis))) {
    parts[part.type] = part.value
  }

  let year = Number(parts.year)
  // Astronomical year numbering: 1 BC is year 0, 2 BC is -1.
  if (parts.era && /^B/.test(parts.era)) year = 1 - year

  const wallClockAsUtc = Date.UTC(
    year,
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  )

  return (wallClockAsUtc - utcMillis) / 60_000
}

/**
 * True when a zone offset is a Local Mean Time value rather than a legislated
 * standard offset.
 *
 * Every standard offset ever legislated is a whole number of minutes and, in
 * practice, a multiple of a quarter hour. LMT offsets are the longitude of the
 * zone's reference city divided by 15 and are essentially never round.
 *
 * This matters more than it looks. For a pre-standard-time birth, tzdb returns
 * the LMT of the *zone's reference city*, not of the birth place. Europe/Berlin
 * in 1879 gives +53.47 minutes -- Berlin's LMT. A birth in Ulm, 3.4 degrees
 * further west, is +40 minutes. Using the zone value would put the Ascendant
 * out by more than three degrees, which is a sign boundary error waiting to
 * happen. So when we detect the LMT era we recompute from the actual birth
 * longitude instead.
 */
function isLocalMeanTime(offsetMinutes: number): boolean {
  return Math.abs(offsetMinutes * 60) % 900 > 1e-6
}

/** Local Mean Time offset for a longitude: 4 minutes per degree, east positive. */
export function lmtOffsetMinutes(longitudeEast: number): number {
  return (longitudeEast / 15) * 60
}

function formatOffsetLabel(offsetMinutes: number, source: OffsetSource): string {
  const sign = offsetMinutes < 0 ? '-' : '+'
  const total = Math.abs(offsetMinutes)
  const hours = Math.floor(total / 60)
  const minutes = total - hours * 60
  const hhmm = `${sign}${String(hours).padStart(2, '0')}:${String(Math.round(minutes)).padStart(2, '0')}`

  if (source === 'lmt') return `LMT ${hhmm} (from longitude)`
  return `UTC${hhmm}`
}

/**
 * Resolve the offset in force for a local date/time at a place, and convert.
 *
 * The local wall clock is ambiguous during a DST fall-back and nonexistent
 * during a spring-forward, so the offset is found by iteration: guess, look up
 * the offset at that guess, correct, repeat. Two passes converge for every
 * real-world rule.
 */
export function resolveOffset(
  local: LocalDateTime,
  zone: string,
  longitudeEast: number,
): ResolvedOffset {
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute)

  let offsetMinutes = zoneOffsetMinutesAt(localAsUtc, zone)
  for (let pass = 0; pass < 2; pass++) {
    offsetMinutes = zoneOffsetMinutesAt(localAsUtc - offsetMinutes * 60_000, zone)
  }

  if (isLocalMeanTime(offsetMinutes)) {
    const lmt = lmtOffsetMinutes(longitudeEast)
    return { offsetMinutes: lmt, source: 'lmt', label: formatOffsetLabel(lmt, 'lmt') }
  }

  return { offsetMinutes, source: 'tzdb', label: formatOffsetLabel(offsetMinutes, 'tzdb') }
}

/** Wrap a caller-supplied offset without consulting tzdb. */
export function manualOffset(offsetMinutes: number): ResolvedOffset {
  return { offsetMinutes, source: 'manual', label: formatOffsetLabel(offsetMinutes, 'manual') }
}

/** Apply a resolved offset: local wall clock -> UTC instant. */
export function toUtc(local: LocalDateTime, offset: ResolvedOffset): Date {
  return new Date(
    Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute)
      - offset.offsetMinutes * 60_000,
  )
}

/** Buddhist Era to Common Era. Thai records routinely use BE. */
export function buddhistToCommonEra(beYear: number): number {
  return beYear - 543
}
