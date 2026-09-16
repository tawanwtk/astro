/**
 * What each tradition associates with a sign or a house, in that tradition's
 * own vocabulary.
 *
 * These are shown only where systems converge, to say what it is they are
 * converging on. They are statements about the *systems*: what Western
 * traditional doctrine holds about Aries, what Jyotiṣa holds about Meṣa. They
 * are not statements about a reader, and nothing here is a prediction, an
 * assessment or advice.
 *
 * The test in divergence.test.ts enforces that: any second-person pronoun, or
 * any predictive or evaluative verb, fails the build. If a phrasing would read
 * as "you are X", it is wrong and does not belong in this file.
 *
 * Rulerships given for the Western column are the traditional (pre-Uranian)
 * ones, because those are the rulerships the tradition being described
 * actually used.
 */
import type { SignIndex } from './signs'
import type { SystemId } from './systems'

export interface Association {
  systemId: SystemId
  systemName: string
  /** One sentence, in that tradition's own terms. */
  text: string
}

type PerSystem = Record<SystemId, string>

/** Indexed by sign, Aries = 0. */
const SIGN_ASSOCIATIONS: PerSystem[] = [
  {
    western: 'Aries is the cardinal fire sign, ruled by Mars. Traditional doctrine treats it as the zodiac’s opening sign, associated with initiative and beginnings.',
    vedic: 'Meṣa, a movable fire rāśi ruled by Maṅgala (Mars). It is the sign of the Sun’s exaltation.',
  },
  {
    western: 'Taurus is the fixed earth sign, ruled by Venus. Tradition associates it with steadiness, and with what is held and cultivated.',
    vedic: 'Vṛṣabha, a fixed earth rāśi ruled by Śukra (Venus). It is the sign of the Moon’s exaltation.',
  },
  {
    western: 'Gemini is the mutable air sign, ruled by Mercury. Tradition associates it with exchange, language and the paired or doubled.',
    vedic: 'Mithuna, a dual air rāśi ruled by Budha (Mercury). Its name means the pair.',
  },
  {
    western: 'Cancer is the cardinal water sign, ruled by the Moon. Tradition associates it with shelter, lineage and the domestic.',
    vedic: 'Karka, a movable water rāśi ruled by Candra (the Moon). It is the sign of Jupiter’s exaltation.',
  },
  {
    western: 'Leo is the fixed fire sign, ruled by the Sun. Tradition associates it with sovereignty and display.',
    vedic: 'Siṃha, a fixed fire rāśi ruled by Sūrya (the Sun). It is the only rāśi with no exaltation assigned to it.',
  },
  {
    western: 'Virgo is the mutable earth sign, ruled by Mercury. Tradition associates it with discrimination, craft and service.',
    vedic: 'Kanyā, a dual earth rāśi ruled by Budha (Mercury), and the one rāśi where Mercury is both ruler and exalted.',
  },
  {
    western: 'Libra is the cardinal air sign, ruled by Venus. Tradition associates it with balance, contract and relation.',
    vedic: 'Tulā, a movable air rāśi ruled by Śukra (Venus). It is the sign of Saturn’s exaltation.',
  },
  {
    western: 'Scorpio is the fixed water sign, ruled in traditional doctrine by Mars. Tradition associates it with what is hidden, and with crisis and transformation.',
    vedic: 'Vṛścika, a fixed water rāśi ruled by Maṅgala (Mars). It is the sign of the Moon’s debilitation.',
  },
  {
    western: 'Sagittarius is the mutable fire sign, ruled by Jupiter. Tradition associates it with distance, doctrine and the far journey.',
    vedic: 'Dhanus, a dual fire rāśi ruled by Guru (Jupiter), and a sign long associated with dharma and teaching.',
  },
  {
    western: 'Capricorn is the cardinal earth sign, ruled by Saturn. Tradition associates it with structure, office and constraint.',
    vedic: 'Makara, a movable earth rāśi ruled by Śani (Saturn). It is the sign of Mars’s exaltation.',
  },
  {
    western: 'Aquarius is the fixed air sign, ruled in traditional doctrine by Saturn. Tradition associates it with the collective and the systematic.',
    vedic: 'Kumbha, a fixed air rāśi ruled by Śani (Saturn). It is the sign of the Sun’s debilitation.',
  },
  {
    western: 'Pisces is the mutable water sign, ruled in traditional doctrine by Jupiter. Tradition associates it with dissolution and the unbounded.',
    vedic: 'Mīna, a dual water rāśi ruled by Guru (Jupiter). It is the sign of Venus’s exaltation.',
  },
]

/** Indexed by house number minus one. */
const HOUSE_ASSOCIATIONS: PerSystem[] = [
  {
    western: 'The first house, rising at the horizon. Ptolemaic tradition calls it the house of the body and of life itself.',
    vedic: 'Tanu bhāva, the house of the body. Its lord is treated as the chart’s primary reference point.',
  },
  {
    western: 'The second house, the house of substance — in traditional terms, movable goods and what is held.',
    vedic: 'Dhana bhāva, the house of wealth, and in classical texts also of speech and of family line.',
  },
  {
    western: 'The third house, traditionally siblings, neighbours and short journeys.',
    vedic: 'Sahaja bhāva, the house of siblings, and classically of effort, courage and the near journey.',
  },
  {
    western: 'The fourth house, at the base of the chart: in tradition, parents, land and foundations.',
    vedic: 'Bandhu or Sukha bhāva, the house of home, mother and the settled ground of things.',
  },
  {
    western: 'The fifth house, traditionally children, and what is made or played for its own sake.',
    vedic: 'Putra bhāva, the house of children, and classically of intellect and of merit carried forward.',
  },
  {
    western: 'The sixth house, traditionally illness, labour and servants — the difficulties of daily life.',
    vedic: 'Ari bhāva, the house of adversaries, debt and illness. One of the three duḥsthāna houses.',
  },
  {
    western: 'The seventh house, opposite the Ascendant: marriage and partnership, and also open opposition.',
    vedic: 'Yuvati or Kalatra bhāva, the house of the spouse and of partnership.',
  },
  {
    western: 'The eighth house, traditionally death, inheritance and the substance of others.',
    vedic: 'Randhra or Āyus bhāva, the house of longevity, of hidden things and of sudden change.',
  },
  {
    western: 'The ninth house, traditionally long journeys, religion and philosophy.',
    vedic: 'Dharma bhāva, the house of law, teachers and pilgrimage — one of the auspicious triṇa houses.',
  },
  {
    western: 'The tenth house, at the top of the chart: honour, profession and public standing.',
    vedic: 'Karma bhāva, the house of action and of work in the world.',
  },
  {
    western: 'The eleventh house, traditionally friends, allies and hopes.',
    vedic: 'Lābha bhāva, the house of gain, and of networks and elder siblings.',
  },
  {
    western: 'The twelfth house, traditionally confinement, hidden enemies and withdrawal.',
    vedic: 'Vyaya bhāva, the house of expenditure, loss and release — also of retreat and of the foreign.',
  },
]

function collect(
  table: PerSystem[],
  index: number,
  systemIds: SystemId[],
  systemNames: Record<string, string>,
): Association[] {
  const row = table[index]
  if (!row) return []

  return systemIds
    .filter((id) => row[id])
    .map((id) => ({ systemId: id, systemName: systemNames[id], text: row[id] }))
}

/** What each selected tradition associates with a sign they all agree on. */
export function signAssociations(
  sign: SignIndex,
  systemIds: SystemId[],
  systemNames: Record<string, string>,
): Association[] {
  return collect(SIGN_ASSOCIATIONS, sign, systemIds, systemNames)
}

/** What each selected tradition associates with a house they all agree on. */
export function houseAssociations(
  house: number,
  systemIds: SystemId[],
  systemNames: Record<string, string>,
): Association[] {
  return collect(HOUSE_ASSOCIATIONS, house - 1, systemIds, systemNames)
}

/** Every string in this module, for the framing test to scan. */
export function allAssociationText(): string {
  return [...SIGN_ASSOCIATIONS, ...HOUSE_ASSOCIATIONS]
    .flatMap((row) => Object.values(row))
    .join(' ')
}
