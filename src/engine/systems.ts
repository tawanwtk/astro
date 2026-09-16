/**
 * The interpretive systems the tool can compare.
 *
 * A system is a way of *reading* one computation, not a second computation:
 * a zodiac origin (an ayanamsa, or none) plus a house rule. Adding one here is
 * all it takes for the engine, the comparison and the toggles to pick it up.
 *
 * The exception is a tradition that computes its own planetary positions
 * rather than reinterpreting these. Thai Suriyayart is exactly that, which is
 * why it is not in this list -- see `THAI_SURIYAYART_NOTE` below.
 */

export type SystemId = 'western' | 'vedic'

export type Zodiac = 'tropical' | 'sidereal'
export type HouseSystem = 'placidus' | 'whole-sign'

export interface SystemDefinition {
  id: SystemId
  /** Full name, for headings. */
  name: string
  /** Column heading. */
  shortName: string
  zodiac: Zodiac
  /**
   * Swiss Ephemeris sidereal mode, or null for the tropical frame.
   * `1` is SE_SIDM_LAHIRI.
   */
  ayanamsaMode: number | null
  /** Human name of the ayanamsa, or null. */
  ayanamsaName: string | null
  houseSystem: HouseSystem
  /** Prose for the frames section. */
  zodiacNote: string
  houseNote: string
}

export const SYSTEMS: Record<SystemId, SystemDefinition> = {
  western: {
    id: 'western',
    name: 'Western tropical',
    shortName: 'Western',
    zodiac: 'tropical',
    ayanamsaMode: null,
    ayanamsaName: null,
    houseSystem: 'placidus',
    zodiacNote:
      'The tropical zodiac is tied to the seasons. Zero degrees Aries is '
      + 'defined as the March equinox -- the moment the Sun crosses the '
      + "celestial equator going north. The zodiac is anchored to the Earth's "
      + 'relationship with the Sun, not to the stars.',
    houseNote:
      'Placidus divides the sky by unequal arcs, based on the time it takes '
      + 'each degree of the ecliptic to rise. House sizes depend on the exact '
      + 'time and the latitude of birth, and the system breaks down entirely '
      + 'near the poles, where some degrees never rise at all.',
  },
  vedic: {
    id: 'vedic',
    name: 'Vedic sidereal',
    shortName: 'Vedic',
    zodiac: 'sidereal',
    ayanamsaMode: 1,
    ayanamsaName: 'Lahiri',
    houseSystem: 'whole-sign',
    zodiacNote:
      'The sidereal zodiac is tied to the stars. It keeps zero degrees Aries '
      + 'fixed against a stellar reference rather than against the equinox. '
      + 'Since the two definitions coincided, they have drifted apart.',
    houseNote:
      'Whole sign gives each house one entire sign. The sign rising at birth '
      + 'is the whole of the first house, the next sign the second, and so on. '
      + 'House boundaries and sign boundaries are the same thing, so latitude '
      + 'does not enter into it.',
  },
}

export const SYSTEM_IDS = Object.keys(SYSTEMS) as SystemId[]

/** The default selection: everything the engine can compare. */
export const DEFAULT_SELECTION: SystemId[] = [...SYSTEM_IDS]

/**
 * Why Thai is not a third column here.
 *
 * Thai astrology (โหราศาสตร์ไทย) does use a sidereal zodiac and whole sign
 * houses counted from the lagna, so on the face of it it looks like Vedic with
 * a different ayanamsa. It is not.
 *
 * Traditional Thai positions come from the Suriyayart canon (คัมภีร์สุริยยาตร์),
 * a mean-motion theory in the Surya Siddhanta lineage with its own epoch. Its
 * longitudes cannot be produced by subtracting any constant from a modern
 * tropical position, because the deviation is different for every body.
 * Measured against published Thai almanac values for two dates a year apart:
 *
 *     Sun       -0.26   -0.25    (close to sidereal, and stable)
 *     Jupiter   +0.65   +0.44
 *     Moon      +0.58   +2.42
 *     Mars      -2.02   -1.18
 *     Venus     -3.29   -2.63
 *     Mercury   -4.80  -20.91
 *     Saturn    -5.69   -5.54    (large, and stable)
 *
 * A single ayanamsa would make that column a constant. Instead it spans six
 * degrees on one date and twenty-three on the other -- the accumulated error
 * of an old planetary theory, structural rather than random.
 *
 * Implementing it means implementing that theory. The solar part is
 * reproducible: the Thai year of 292207/800 days is the Surya Siddhanta
 * sidereal year, and a Surya Siddhanta solar model matches the Thai almanac
 * Sun to 0.34 degrees on both dates. The lunar and planetary constants of the
 * Thai recension differ from the Sanskrit ones and are published in printed
 * Thai manuscripts rather than anywhere reachable, so the rest does not
 * reproduce -- errors of three to twenty-five degrees, which is whole signs
 * wrong.
 *
 * So it is not shipped. A Thai column that is several signs wrong would be
 * worse than no Thai column, and this tool's whole claim is that it does not
 * do that.
 */
export const THAI_SURIYAYART_NOTE = `Thai astrology is not included yet, and `
  + `the reason is worth stating. It reads a sidereal zodiac with whole sign `
  + `houses, so it looks like Vedic with a different offset -- but traditional `
  + `Thai positions come from the Suriyayart canon, an older planetary theory `
  + `that computes its own longitudes. Against published Thai almanac values, `
  + `the gap from Vedic runs from a quarter of a degree for the Sun to more `
  + `than five for Saturn, and it is not the same gap on different dates. No `
  + `single offset reproduces it. Adding it properly means implementing that `
  + `theory, and a column that was several signs wrong would be worse than no `
  + `column at all.`
