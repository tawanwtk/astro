/**
 * Offline place lookup.
 *
 * The list is bundled and loaded from our own origin. There is no geocoding
 * API and there must never be one -- a lookup that leaves the browser would
 * transmit the one piece of birth data we promise not to transmit.
 *
 * Regenerate with `npm run build:cities`.
 */

export interface Place {
  name: string
  country: string
  /** IANA zone, e.g. `Asia/Bangkok`. */
  zone: string
  /** North positive. */
  latitude: number
  /** East positive. */
  longitudeEast: number
  population: number
}

type PackedCity = [
  name: string,
  countryIndex: number,
  zoneIndex: number,
  latitude: number,
  longitudeEast: number,
  population: number,
]

interface PackedPlaces {
  zones: string[]
  countries: string[]
  cities: PackedCity[]
}

let cache: Place[] | null = null
let loading: Promise<Place[]> | null = null

/**
 * Load the place list. Dynamically imported so its ~130 kB stays off the
 * critical path -- nothing needs it until the reader starts typing.
 */
export async function loadPlaces(): Promise<Place[]> {
  if (cache) return cache
  if (!loading) {
    loading = import('./places.json').then((module) => {
      const packed = (module.default ?? module) as unknown as PackedPlaces
      cache = packed.cities.map(([name, country, zone, latitude, longitudeEast, population]) => ({
        name,
        country: packed.countries[country],
        zone: packed.zones[zone],
        latitude,
        longitudeEast,
        population,
      }))
      return cache
    })
  }
  return loading
}

/**
 * Prefix search, largest places first.
 *
 * The list is pre-sorted by population, so a linear scan returns the obvious
 * answer without ranking work. Names that start with the query beat names that
 * merely contain it, so typing "york" still offers New York but "york" first.
 */
export function searchPlaces(places: Place[], query: string, limit = 8): Place[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []

  const startsWith: Place[] = []
  const contains: Place[] = []

  for (const place of places) {
    const name = place.name.toLowerCase()
    if (name.startsWith(needle)) {
      startsWith.push(place)
      if (startsWith.length >= limit) break
    } else if (contains.length < limit && name.includes(needle)) {
      contains.push(place)
    }
  }

  return [...startsWith, ...contains].slice(0, limit)
}

/** `13.7500 N, 100.5166 E` -- shown so the reader can check what we used. */
export function formatCoordinates(latitude: number, longitudeEast: number): string {
  const ns = latitude >= 0 ? 'N' : 'S'
  const ew = longitudeEast >= 0 ? 'E' : 'W'
  return `${Math.abs(latitude).toFixed(4)} ${ns}, ${Math.abs(longitudeEast).toFixed(4)} ${ew}`
}
