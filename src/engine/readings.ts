/**
 * Readings: attributed traditional meanings, assembled by lookup.
 *
 * Nothing here is written for the chart in front of it. Every sentence comes
 * out of a fixed table -- the nature a tradition assigns a planet, the
 * signification it assigns a sign and a house, the dignity its own scheme
 * gives that planet in that sign -- and the assembly is mechanical. Change the
 * birth data and the same tables are indexed differently. That is the whole
 * design: a reading here is a *lookup result*, and the reader can see which
 * four lookups produced it.
 *
 * The point of showing them side by side is not the content of any one
 * reading. It is that two traditions, handed the same body at the same moment,
 * reach for different vocabularies and often land on a different sign, a
 * different house and a different dignity -- and each is internally
 * consistent. The interesting case is a convergent placement, where both
 * traditions agree on where the body *is* and still describe it differently.
 *
 * Framing rules, enforced by the test in readings.test.ts and inherited from
 * PROJECT_BRIEF.md: every sentence is about a tradition or a placement, never
 * about a reader. No second person, no prediction, no advice, no evaluation of
 * a person. "Jyotisa counts an exalted Mangala as uccha" is a fact about
 * Jyotisa. "You are ambitious" is not, and does not belong anywhere in this
 * file or in anything it generates.
 */
import type { PointId } from './chart'
import type { Comparison } from './divergence'
import { type Body, BODIES } from './ephemeris'
import { type DignityFinding, dignityOf } from './dignity'
import { houseSignification, signSignification } from './associations'
import { formatDegrees, type SignIndex, SIGNS } from './signs'
import { type SystemId, SYSTEMS } from './systems'

/** Which lookup a strand of the reading came out of. */
export type ReadingSource = 'planet' | 'sign' | 'dignity' | 'house'

export const SOURCE_LABELS: Record<ReadingSource, string> = {
  planet: 'The body',
  sign: 'The sign',
  dignity: 'Dignity',
  house: 'The house',
}

export interface ReadingStrand {
  source: ReadingSource
  text: string
}

export interface Reading {
  systemId: SystemId
  systemName: string
  /** Where this tradition's vocabulary comes from, named on the page. */
  attribution: string
  /** The body under this tradition's own name for it. */
  bodyName: string
  /** The sign under this tradition's own name for it. */
  signName: string
  degreeInSign: number
  house: number | null
  dignity: DignityFinding | null
  /** Placement and dignity in one line, in this tradition's words. */
  headline: string
  /** The lookups behind the headline, kept separable. */
  strands: ReadingStrand[]
}

export interface BodyReading {
  point: PointId
  label: string
  /** True when every selected tradition put this body in the same sign. */
  signConverges: boolean
  /** True when every selected tradition put it in the same house. */
  houseConverges: boolean
  readings: Reading[]
}

/* ------------------------------------------------------------------ names */

/** Each tradition's own name for the twelve signs, indexed Aries/Mesa = 0. */
const SIGN_NAMES: Record<SystemId, readonly string[]> = {
  western: SIGNS,
  vedic: [
    'Meṣa', 'Vṛṣabha', 'Mithuna', 'Karka', 'Siṃha', 'Kanyā',
    'Tulā', 'Vṛścika', 'Dhanus', 'Makara', 'Kumbha', 'Mīna',
  ],
}

const BODY_NAMES: Record<SystemId, Record<Body, string>> = {
  western: {
    sun: 'The Sun', moon: 'The Moon', mercury: 'Mercury', venus: 'Venus',
    mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  },
  vedic: {
    sun: 'Sūrya', moon: 'Candra', mercury: 'Budha', venus: 'Śukra',
    mars: 'Maṅgala', jupiter: 'Guru', saturn: 'Śani',
  },
}

const ASCENDANT_NAME: Record<SystemId, string> = {
  western: 'The Ascendant',
  vedic: 'The lagna',
}

const ATTRIBUTIONS: Record<SystemId, string> = {
  western: 'Western traditional — Hellenistic doctrine as it reaches modern '
    + 'practice through Ptolemy',
  vedic: 'Jyotiṣa — Parāśarī doctrine, after the Bṛhat Parāśara Horā Śāstra',
}

/* -------------------------------------------------------- planetary nature */

const PLANET_NATURE: Record<SystemId, Record<Body, string>> = {
  western: {
    sun: 'The Sun is the greater light and leader of the day sect, hot and dry '
      + 'in the traditional qualities. Its significations are the father, '
      + 'vitality, office and honour.',
    moon: 'The Moon is the lesser light and leader of the night sect, moist and '
      + 'changeable. Tradition assigns it the mother, the body, and the habits '
      + 'of ordinary life.',
    mercury: 'Mercury is common in nature, taking the quality of whatever it is '
      + 'joined to, and belongs to no sect on its own. Its significations are '
      + 'speech, reckoning, commerce and the hand.',
    venus: 'Venus is the lesser benefic, temperate and moist, of the night sect. '
      + 'Tradition assigns it love, ornament, music and what is made for its own '
      + 'pleasure.',
    mars: 'Mars is the lesser malefic, hot and dry, of the night sect. Its '
      + 'significations are iron, fire, war and surgery — whatever is done by '
      + 'force or by cutting.',
    jupiter: 'Jupiter is the greater benefic, temperate and of the day sect. '
      + 'Tradition assigns it law, doctrine, increase and good repute.',
    saturn: 'Saturn is the greater malefic, cold and dry, of the day sect. Its '
      + 'significations are time, limit, land, age, and what endures by weight '
      + 'rather than by speed.',
  },
  vedic: {
    sun: 'Sūrya is the ātmakāraka of the natural order — the significator of the '
      + 'self — and a harsh graha in Parāśarī classification. It signifies the '
      + 'father, royal authority and the bones.',
    moon: 'Candra is the kāraka of manas, the mind, and of the mother. Its '
      + 'classification is not fixed: doctrine counts it benefic while waxing '
      + 'and weak while waning, so the tithi of birth decides it.',
    mercury: 'Budha is the kāraka of speech and of discrimination. It is benefic '
      + 'only while unaccompanied — joined to a malefic it is counted malefic, '
      + 'a rule of association with no Western equivalent.',
    venus: 'Śukra is a natural benefic and the kāraka of the spouse, of vehicles '
      + 'and of refinement. In the mythology the doctrine draws on, it is the '
      + 'guru of the asuras.',
    mars: 'Maṅgala is a natural malefic and the kāraka of brothers, of land and '
      + 'of physical strength. In the court of the grahas it holds the rank of '
      + 'commander.',
    jupiter: 'Guru is the greatest natural benefic and the kāraka of children, '
      + 'of wealth and of the teacher. Its dṛṣṭi — its aspect — is held to '
      + 'protect whatever house it falls upon.',
    saturn: 'Śani is the greatest natural malefic and the kāraka of longevity, '
      + 'of sorrow and of labour. It is the slowest of the seven, and doctrine '
      + 'treats what it gives as arriving late and staying.',
  },
}

const ASCENDANT_NATURE: Record<SystemId, string> = {
  western: 'The Ascendant is the degree of the ecliptic rising at the eastern '
    + 'horizon at the moment of birth. It is not a body and has no nature of '
    + 'its own; tradition treats it as the point the chart is read from.',
  vedic: 'The lagna is the rising degree, and Jyotiṣa treats it as the first '
    + 'reference of the chart: every bhāva is counted from its rāśi, and the '
    + 'strength of its lord conditions the reading of everything else.',
}

/* --------------------------------------------------------------- assembly */

const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
]

/** How each tradition names a house in running prose. */
function housePhrase(systemId: SystemId, house: number): string {
  const ordinal = ORDINALS[house - 1] ?? String(house)
  return systemId === 'vedic' ? `the ${ordinal} bhāva` : `the ${ordinal} house`
}

/**
 * The dignity sentence, in the tradition's own terms.
 *
 * The exact degree is included because it is the place the two traditions
 * visibly disagree about doctrine they otherwise share: both exalt the Sun in
 * the first sign, and they put the exact degree nine degrees apart.
 */
function dignitySentence(
  systemId: SystemId,
  bodyName: string,
  signName: string,
  dignity: DignityFinding,
): string {
  const exact = dignity.exactDegree === null
    ? ''
    : ` This tradition puts the exact degree at ${dignity.exactDegree}° of ${signName}.`

  switch (dignity.kind) {
    case 'exaltation':
      return systemId === 'vedic'
        ? `${bodyName} is uccha — exalted — in ${signName}, the strongest `
          + `placement Parāśarī doctrine assigns it.${exact}`
        : `${bodyName} is in exaltation in ${signName}, the sign tradition calls `
          + `its place of honour.${exact}`
    case 'fall':
      return systemId === 'vedic'
        ? `${bodyName} is nīca — debilitated — in ${signName}, the rāśi opposite `
          + `its exaltation.${exact}`
        : `${bodyName} is in fall in ${signName}, the sign opposite its `
          + `exaltation.${exact}`
    case 'domicile':
      return systemId === 'vedic'
        ? `${signName} is the own rāśi of ${bodyName} — svakṣetra — so doctrine `
          + `reads it as standing on its own ground.`
        : `${bodyName} is in domicile in ${signName}, a sign it rules, which `
          + `tradition counts as the plainest form of essential dignity.`
    case 'mulatrikona':
      return `${bodyName} falls inside its mūlatrikoṇa band in ${signName} — a `
        + `degree range within a ruled rāśi that Jyotiṣa ranks above ordinary `
        + `rulership. Western doctrine has no such category.`
    case 'detriment':
      return `${bodyName} is in detriment in ${signName}, the sign opposite one `
        + `it rules. The category is Western: Jyotiṣa does not use it, and `
        + `assigns this placement no debility on that ground.`
  }
}

function buildReading(
  systemId: SystemId,
  point: PointId,
  sign: SignIndex,
  degreeInSign: number,
  house: number | null,
): Reading {
  const signName = SIGN_NAMES[systemId][sign]
  const isAscendant = point === 'ascendant'
  const bodyName = isAscendant
    ? ASCENDANT_NAME[systemId]
    : BODY_NAMES[systemId][point as Body]

  const dignity = isAscendant
    ? null
    : dignityOf(systemId, point as Body, sign, degreeInSign)

  const strands: ReadingStrand[] = [
    {
      source: 'planet',
      text: isAscendant
        ? ASCENDANT_NATURE[systemId]
        : PLANET_NATURE[systemId][point as Body],
    },
    { source: 'sign', text: signSignification(sign, systemId) },
  ]

  if (dignity) {
    strands.push({
      source: 'dignity',
      text: dignitySentence(systemId, bodyName, signName, dignity),
    })
  }

  if (house !== null) {
    strands.push({ source: 'house', text: houseSignification(house, systemId) })
  }

  const placement = `${bodyName} stands at ${formatDegrees(degreeInSign)} of ${signName}`
  const inHouse = house === null ? '' : `, in ${housePhrase(systemId, house)}`
  const withDignity = dignity ? `, ${dignity.term}` : ''

  return {
    systemId,
    systemName: SYSTEMS[systemId].name,
    attribution: ATTRIBUTIONS[systemId],
    bodyName,
    signName,
    degreeInSign,
    house,
    dignity,
    headline: `${placement}${inHouse}${withDignity}.`,
    strands,
  }
}

/**
 * Assemble a reading per selected tradition, for every body in the chart.
 *
 * Built from the comparison rather than the raw chart, so each entry can say
 * whether the traditions actually agreed about the placement being read. A
 * convergent placement described two different ways is the case worth looking
 * at, and the readings section leads with those.
 */
export function buildReadings(comparison: Comparison): BodyReading[] {
  return comparison.rows.map((row) => ({
    point: row.point,
    label: row.label,
    signConverges: row.sign.verdict === 'converge',
    houseConverges: row.house.verdict === 'converge',
    readings: row.placements
      .filter((entry) => entry.placement !== null)
      .map(({ systemId, placement }) => buildReading(
        systemId,
        row.point,
        placement!.sign,
        placement!.degreeInSign,
        placement!.house,
      )),
  }))
}

/** Every generated string, for the framing test to scan. */
export function allReadingText(comparison: Comparison): string {
  return buildReadings(comparison)
    .flatMap((body) => body.readings
      .flatMap((reading) => [reading.headline, ...reading.strands.map((s) => s.text)]))
    .join(' ')
}

/** Every fixed string in the tables, independent of any chart. */
export function allReadingTables(): string {
  return [
    ...Object.values(PLANET_NATURE).flatMap((row) => Object.values(row)),
    ...Object.values(ASCENDANT_NATURE),
    ...Object.values(ATTRIBUTIONS),
    ...Object.values(READINGS_FRAMING),
  ].join(' ')
}

/** Bodies the readings cover: the seven classical planets plus the Ascendant. */
export const READING_BODY_COUNT = BODIES.length + 1

/**
 * The framing, stated plainly and shown with the readings rather than filed
 * under a disclaimer nobody opens.
 */
export const READINGS_FRAMING = {
  heading: 'What these are, and what they are not',
  standing:
    'Astrology is not evidence-based. There is no established mechanism by '
    + 'which the position of a planet bears on a life, and controlled tests of '
    + 'astrological claims have not supported them. Nothing below is an '
    + 'exception to that, and none of it is offered as one.',
  method:
    'What these readings are is a lookup. Each tradition has a fixed '
    + 'vocabulary — a nature for each body, a signification for each sign and '
    + 'each house, a scheme of essential dignity — recorded in its own texts '
    + 'over centuries. The chart selects which entries apply, and they are '
    + 'assembled in order. No sentence is written for a particular chart, and '
    + 'the lookups behind each reading are shown next to it.',
  payoff:
    'The reason to read them side by side is the vocabularies, not the verdicts. '
    + 'Handed the same body at the same moment, the traditions frequently name a '
    + 'different sign, a different house and a different dignity — and where '
    + 'they do agree on the placement, they still describe it in terms that do '
    + 'not translate. That disagreement is observable. What any of it means '
    + 'about a person is not something this tool claims to know.',
} as const
