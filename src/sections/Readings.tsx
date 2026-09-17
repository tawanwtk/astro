/**
 * Six — the readings.
 *
 * Composition: a parallel text. Each body is a spread, and the traditions face
 * each other in columns like a facing-page translation, because that is
 * exactly what they are: the same placement rendered into two vocabularies
 * that do not map onto one another. Nothing else in the document is set this
 * way.
 *
 * Convergent placements are lifted to the top. They are the case the section
 * is for -- both traditions agree on where the body is, and still describe it
 * in terms that will not translate.
 *
 * The framing is a standing part of the section, set at its head at full
 * reading size, not a footnote and not a collapsed disclaimer. Astrology is
 * not evidence-based, the readings are a lookup rather than a judgement, and a
 * reader who reads only the first paragraph here should already know both.
 */
import type { Comparison } from '../engine/divergence'
import {
  type BodyReading, type Reading,
  READINGS_FRAMING, SOURCE_LABELS, buildReadings,
} from '../engine/readings'
import { DIGNITY_NOTES } from '../engine/dignity'
import { SYSTEM_IDS, SYSTEMS } from '../engine/systems'

function ReadingColumn({ reading }: { reading: Reading }) {
  return (
    <article className={`reading reading-${reading.systemId}`}>
      <header className="reading-head">
        <h4>{reading.systemName}</h4>
        <p className="reading-attribution">{reading.attribution}</p>
      </header>

      <p className="reading-headline">{reading.headline}</p>

      <dl className="reading-strands">
        {reading.strands.map((strand) => (
          <div key={strand.source} className={`strand strand-${strand.source}`}>
            <dt>{SOURCE_LABELS[strand.source]}</dt>
            <dd>{strand.text}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

function BodySpread({ body }: { body: BodyReading }) {
  const agreed = [
    body.signConverges ? 'sign' : null,
    body.houseConverges ? 'house' : null,
  ].filter(Boolean)

  return (
    <section className={`spread${agreed.length ? ' spread-converged' : ''}`}>
      <header className="spread-head">
        <h3>{body.label}</h3>
        {agreed.length > 0 && (
          <p className="spread-note">
            Both traditions place this in the same {agreed.join(' and the same ')}.
            What follows is one placement, described twice.
          </p>
        )}
      </header>

      <div className="spread-columns">
        {body.readings.map((reading) => (
          <ReadingColumn key={reading.systemId} reading={reading} />
        ))}
      </div>
    </section>
  )
}

export function Readings({ comparison }: { comparison: Comparison | null }) {
  if (!comparison) return null

  const readings = buildReadings(comparison)
  // Convergent placements first: they are the case worth reading, and putting
  // them at the top means the reader meets the argument before the catalogue.
  const ordered = [
    ...readings.filter((body) => body.signConverges || body.houseConverges),
    ...readings.filter((body) => !body.signConverges && !body.houseConverges),
  ]

  return (
    <section id="readings" className="section section-deep">
      <div className="shell">
        <span className="plate-number">Six — the readings</span>
        <h2>The same sky, two vocabularies</h2>

        <div className="framing">
          <h3>{READINGS_FRAMING.heading}</h3>
          <p className="framing-standing">{READINGS_FRAMING.standing}</p>
          <p>{READINGS_FRAMING.method}</p>
          <p>{READINGS_FRAMING.payoff}</p>
        </div>

        <div className="dignity-notes">
          <h3>The two schemes of dignity</h3>
          <dl>
            {SYSTEM_IDS.map((id) => (
              <div key={id}>
                <dt>{SYSTEMS[id].name}</dt>
                <dd>{DIGNITY_NOTES[id]}</dd>
              </div>
            ))}
          </dl>
        </div>

        <hr className="rule rule-heavy" />

        <div className="spreads">
          {ordered.map((body) => (
            <BodySpread key={body.point} body={body} />
          ))}
        </div>
      </div>
    </section>
  )
}
