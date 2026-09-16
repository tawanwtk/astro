/**
 * Zodiac sign arithmetic and degree formatting.
 *
 * Both traditions divide the ecliptic into twelve 30-degree signs; they
 * disagree only about where the circle starts. So this module knows nothing
 * about tropical or sidereal -- it is pure arithmetic on a longitude that has
 * already been expressed in whichever frame the caller wants.
 */

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const

export type SignName = (typeof SIGNS)[number]

/** Sign index 0-11, Aries = 0. */
export type SignIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

/** Wrap any longitude into [0, 360). */
export function norm360(longitude: number): number {
  const wrapped = longitude % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

/**
 * Sign containing a longitude.
 *
 * Boundary rule: a sign owns [start, start + 30). 29.97 degrees is still the
 * current sign; exactly 30.0 is the next one. Getting this backwards produces
 * a wrong chart that looks entirely plausible, so it is tested directly.
 */
export function signOf(longitude: number): SignIndex {
  return Math.floor(norm360(longitude) / 30) as SignIndex
}

/** Position within the sign, in [0, 30). */
export function degreeInSign(longitude: number): number {
  return norm360(longitude) - signOf(longitude) * 30
}

/** Shortest angular separation between two longitudes, in [0, 180]. */
export function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(norm360(a) - norm360(b))
  return diff > 180 ? 360 - diff : diff
}

/** Format a degree-in-sign as `12°34'56"`. */
export function formatDegrees(degrees: number): string {
  let d = Math.floor(degrees)
  let remainder = (degrees - d) * 60
  let m = Math.floor(remainder)
  let s = Math.round((remainder - m) * 60)

  // Carry, so 12°59'60" is never emitted.
  if (s === 60) { s = 0; m += 1 }
  if (m === 60) { m = 0; d += 1 }

  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
}

/** Format an absolute ecliptic longitude as `Pisces 23°30'12"`. */
export function formatLongitude(longitude: number): string {
  return `${SIGNS[signOf(longitude)]} ${formatDegrees(degreeInSign(longitude))}`
}
