/**
 * Essential dignity, per tradition.
 *
 * Both traditions inherited the same Hellenistic scheme of exaltations and
 * then diverged on the details, which is exactly why this is two tables and
 * not one shared table with a rename applied.
 *
 * The differences that survive are real and checkable:
 *
 *   - The exaltation *degrees* differ for three bodies. Western traditional
 *     puts the Sun's exaltation at 19 Aries, Jyotiṣa at 10 Meṣa; Jupiter at
 *     15 Cancer against 5 Karka; Saturn at 21 Libra against 20 Tulā.
 *   - Western doctrine has detriment -- a planet in the sign opposite its
 *     domicile. Jyotiṣa has no such category at all, and reading one in is a
 *     common error. The table says so by omission, and `DIGNITY_NOTES`
 *     says so in words.
 *   - Jyotiṣa has mūlatrikoṇa, a degree range within one sign that outranks
 *     ordinary rulership. Western doctrine has no equivalent.
 *
 * Rulerships here are the traditional, pre-Uranian ones on both sides, because
 * those are the rulerships each tradition's dignity scheme was built on.
 */
import type { Body } from './ephemeris'
import type { SignIndex } from './signs'
import type { SystemId } from './systems'

export type DignityKind =
  /** In a sign it rules. */
  | 'domicile'
  /** Jyotiṣa only: a degree band within a ruled sign, outranking rulership. */
  | 'mulatrikona'
  | 'exaltation'
  /** Western only: the sign opposite a ruled sign. */
  | 'detriment'
  | 'fall'

export interface DignityFinding {
  kind: DignityKind
  /** The tradition's own word for it. */
  term: string
  /** Where the tradition puts the exact degree, when the kind has one. */
  exactDegree: number | null
  /** Rank for ordering and emphasis. Higher is stronger. */
  strength: number
}

/** Sign indices a planet rules, in both traditions. */
const DOMICILES: Record<Body, SignIndex[]> = {
  sun: [4],
  moon: [3],
  mercury: [2, 5],
  venus: [1, 6],
  mars: [0, 7],
  jupiter: [8, 11],
  saturn: [9, 10],
}

/** Sign of exaltation and the degree the tradition marks as exact. */
type Exaltation = { sign: SignIndex; degree: number }

const WESTERN_EXALTATIONS: Record<Body, Exaltation> = {
  sun: { sign: 0, degree: 19 },
  moon: { sign: 1, degree: 3 },
  mercury: { sign: 5, degree: 15 },
  venus: { sign: 11, degree: 27 },
  mars: { sign: 9, degree: 28 },
  jupiter: { sign: 3, degree: 15 },
  saturn: { sign: 6, degree: 21 },
}

const VEDIC_EXALTATIONS: Record<Body, Exaltation> = {
  sun: { sign: 0, degree: 10 },
  moon: { sign: 1, degree: 3 },
  mercury: { sign: 5, degree: 15 },
  venus: { sign: 11, degree: 27 },
  mars: { sign: 9, degree: 28 },
  jupiter: { sign: 3, degree: 5 },
  saturn: { sign: 6, degree: 20 },
}

/** Jyotiṣa mūlatrikoṇa: sign plus the degree band within it. */
const MULATRIKONA: Record<Body, { sign: SignIndex; from: number; to: number }> = {
  sun: { sign: 4, from: 0, to: 20 },
  moon: { sign: 1, from: 4, to: 30 },
  mercury: { sign: 5, from: 16, to: 20 },
  venus: { sign: 6, from: 0, to: 15 },
  mars: { sign: 0, from: 0, to: 12 },
  jupiter: { sign: 8, from: 0, to: 10 },
  saturn: { sign: 10, from: 0, to: 20 },
}

const opposite = (sign: SignIndex): SignIndex => ((sign + 6) % 12) as SignIndex

/**
 * The strongest dignity a body holds in a sign, by one tradition's rules, or
 * null where the tradition assigns it none.
 *
 * Only one finding is returned. A planet cannot be both exalted and in fall,
 * and mūlatrikoṇa is a stronger statement than the domicile it sits inside,
 * so the ranking below is the doctrine's own ordering rather than a choice.
 */
export function dignityOf(
  systemId: SystemId,
  body: Body,
  sign: SignIndex,
  degreeInSign: number,
): DignityFinding | null {
  const vedic = systemId === 'vedic'
  const exaltation = vedic ? VEDIC_EXALTATIONS[body] : WESTERN_EXALTATIONS[body]

  if (exaltation.sign === sign) {
    return {
      kind: 'exaltation',
      term: vedic ? 'uccha' : 'exaltation',
      exactDegree: exaltation.degree,
      strength: 5,
    }
  }

  if (opposite(exaltation.sign) === sign) {
    return {
      kind: 'fall',
      term: vedic ? 'nīca' : 'fall',
      exactDegree: exaltation.degree,
      strength: 0,
    }
  }

  if (vedic) {
    const trikona = MULATRIKONA[body]
    if (trikona.sign === sign && degreeInSign >= trikona.from && degreeInSign < trikona.to) {
      return { kind: 'mulatrikona', term: 'mūlatrikoṇa', exactDegree: null, strength: 4 }
    }
  }

  if (DOMICILES[body].includes(sign)) {
    return {
      kind: 'domicile',
      term: vedic ? 'svakṣetra' : 'domicile',
      exactDegree: null,
      strength: 3,
    }
  }

  // Detriment is Western doctrine only. Jyotiṣa does not use the category, and
  // inventing one here would be putting words in the tradition's mouth.
  if (!vedic && DOMICILES[body].some((ruled) => opposite(ruled) === sign)) {
    return { kind: 'detriment', term: 'detriment', exactDegree: null, strength: 1 }
  }

  return null
}

/**
 * What each tradition's dignity scheme is, said once, so the readings do not
 * have to restate it on every row.
 */
export const DIGNITY_NOTES: Record<SystemId, string> = {
  western: 'Western essential dignity ranks a planet by the sign it occupies: '
    + 'domicile in a sign it rules, exaltation in its sign of honour, detriment '
    + 'in the sign opposite its domicile, fall opposite its exaltation. The '
    + 'scheme is Hellenistic and reaches modern practice through Ptolemy.',
  vedic: 'Jyotiṣa inherited the same exaltations and kept a different set of '
    + 'categories: svakṣetra for a ruled sign, uccha and nīca for exaltation '
    + 'and debilitation, and mūlatrikoṇa, a degree band inside one ruled sign '
    + 'that outranks ordinary rulership. There is no equivalent of detriment, '
    + 'and the exact degrees of exaltation differ for the Sun, Jupiter and Saturn.',
}
