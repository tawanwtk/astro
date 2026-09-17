/**
 * Four — the comparison.
 *
 * Composition: the plate. This is the densest section in the document and it
 * is composed as a table of record -- numbered entries, ruled, set with care,
 * the divergence marked in the margin. It gets the full width of the shell and
 * no decoration beyond the marking itself.
 *
 * At narrow widths the same entries are stacked rather than squeezed: a table
 * of five columns at 390px is not a table, and pretending otherwise would fail
 * the readers most likely to be here.
 */
import { Fragment } from 'react'

import type { Chart } from '../engine/chart'
import type { Comparison as ComparisonData, ComparisonRow } from '../engine/divergence'
import { SYSTEMS } from '../engine/systems'

/**
 * Classes naming what each axis did, so the marking points at the actual
 * finding rather than washing the whole row in one ink.
 */
function rowClasses(row: ComparisonRow): string {
  return [
    row.sign.verdict === 'diverge' ? 'sign-diverges' : null,
    row.sign.verdict === 'converge' ? 'sign-converges' : null,
    row.house.verdict === 'diverge' ? 'house-diverges' : null,
    row.house.verdict === 'converge' ? 'house-converges' : null,
  ].filter(Boolean).join(' ')
}

/** Marginal note naming the finding on each axis. */
function FindingMark({ row }: { row: ComparisonRow }) {
  const marks: { key: string; kind: 'diverge' | 'converge'; text: string }[] = []

  if (row.sign.verdict === 'diverge') marks.push({ key: 'sd', kind: 'diverge', text: 'sign differs' })
  if (row.sign.verdict === 'converge') marks.push({ key: 'sc', kind: 'converge', text: 'sign agrees' })
  if (row.house.verdict === 'diverge') marks.push({ key: 'hd', kind: 'diverge', text: 'house differs' })
  if (row.house.verdict === 'converge') marks.push({ key: 'hc', kind: 'converge', text: 'house agrees' })

  if (marks.length === 0) return <span className="mark-none">not compared</span>

  return (
    <span className="marks">
      {marks.map((mark) => (
        <span key={mark.key} className={`mark mark-${mark.kind}`}>{mark.text}</span>
      ))}
    </span>
  )
}

function Why({ row }: { row: ComparisonRow }) {
  const associations = [...row.sign.associations, ...row.house.associations]

  return (
    <details className="why">
      <summary>Why</summary>
      <p>{row.sign.explanation}</p>
      {row.house.explanation && <p>{row.house.explanation}</p>}

      {associations.length > 0 && (
        <div className="associations">
          <p className="associations-head">
            What each tradition associates with this placement, in its own terms
          </p>
          <dl>
            {associations.map((association, index) => (
              <div key={`${association.systemId}-${index}`}>
                <dt>{association.systemName}</dt>
                <dd>{association.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </details>
  )
}

function ComparisonPlate({ comparison }: { comparison: ComparisonData }) {
  const systems = comparison.systemIds

  return (
    <>
      {/* Wide viewports: a plate table, rows numbered and ruled. */}
      <div className="hidden md:block">
        <table className="plate">
          <caption>
            Each row is one body read through every selected tradition. Rows are
            marked where they differ and where they agree.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="col-index">
                <span className="visually-hidden">Entry</span>
              </th>
              <th scope="col">Body</th>
              {systems.map((id) => (
                <th scope="col" key={id}>
                  {SYSTEMS[id].name}
                  <span className="col-sub">
                    {SYSTEMS[id].houseSystem === 'placidus' ? 'Placidus' : 'whole sign'}
                  </span>
                </th>
              ))}
              <th scope="col">Finding</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row, index) => (
              // Two rows per body: the entry, then its note across the full
              // width. Trapping the explanation in the narrow Finding column
              // made it a ragged ribbon; as a footnote row it reads.
              <Fragment key={row.point}>
                <tr className={`${rowClasses(row)} entry-row`}>
                  <td className="col-index">{String(index + 1).padStart(2, '0')}</td>
                  <th scope="row" className="col-body">
                    {row.label}
                    {row.placements[0]?.placement?.retrograde && <span className="retro"> ℞</span>}
                  </th>
                  {row.placements.map(({ systemId, placement }) => (
                    <td key={systemId}>
                      <span className="value">{placement?.formatted ?? '—'}</span>
                      <span className="house">
                        {placement?.house ? `House ${placement.house}` : 'House undefined'}
                      </span>
                    </td>
                  ))}
                  <td><FindingMark row={row} /></td>
                </tr>
                <tr className={`${rowClasses(row)} note-row`}>
                  <td className="col-index" />
                  <td colSpan={systems.length + 2}>
                    <Why row={row} />
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Narrow viewports: the same entries, stacked. Not a squeezed table. */}
      <ul className="entries md:hidden">
        {comparison.rows.map((row, index) => (
          <li key={row.point} className={`entry ${rowClasses(row)}`}>
            <div className="entry-head">
              <span className="entry-name">
                {row.label}
                {row.placements[0]?.placement?.retrograde && <span className="retro"> ℞</span>}
              </span>
              <FindingMark row={row} />
            </div>

            <div className="entry-frames">
              {row.placements.map(({ systemId, placement }) => (
                <div className="entry-frame" key={systemId}>
                  <span className="tag">{SYSTEMS[systemId].shortName}</span>
                  <span>
                    <span className="value">{placement?.formatted ?? '—'}</span>
                    <span className="house">
                      {placement?.house ? `House ${placement.house}` : 'House undefined'}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <Why row={row} />
            <span className="visually-hidden">Entry {index + 1}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export function Comparison({
  chart, comparison, resultRef,
}: {
  chart: Chart | null
  comparison: ComparisonData | null
  resultRef: React.Ref<HTMLElement>
}) {
  return (
    <section
      id="comparison"
      ref={resultRef}
      tabIndex={-1}
      aria-live="polite"
      className="section"
    >
      <div className="shell">
        <span className="plate-number">Four — the comparison</span>

        {!comparison && (
          <>
            <h2>The comparison</h2>
            <p className="measure lede">
              Enter birth data above and the placements appear here side by side,
              with every difference and every agreement marked.
            </p>
          </>
        )}

        {comparison && chart && (
          <>
            <h2>Where they part</h2>

            <p className="summary-line">
              <span className="count-diverge">
                {comparison.signDivergences} of {comparison.total}
              </span>{' '}
              placements fall in a different sign
              {comparison.housesUndefined ? '. ' : <>
                {' '}and{' '}
                <span className="count-diverge">{comparison.houseDivergences}</span>{' '}
                in a different house.{' '}
              </>}
              <span className="count-converge">{comparison.signConvergences}</span>{' '}
              agree on the sign
              {!comparison.housesUndefined && <>
                {' '}and{' '}
                <span className="count-converge">{comparison.houseConvergences}</span>{' '}
                on the house
              </>}.
            </p>

            <p className="measure gap-note">
              The selected zodiacs begin{' '}
              {comparison.ayanamsas.map((entry, index) => (
                <span key={entry.systemId}>
                  {index > 0 && ', '}
                  {entry.systemName} at {entry.degrees === 0
                    ? 'the equinox'
                    : `${entry.degrees.toFixed(2)}° behind it (${entry.label})`}
                </span>
              ))}
              . A placement keeps its sign across all of them only in the final{' '}
              {comparison.signAgreementWindow.toFixed(1)}° of a tropical sign.
            </p>

            {chart.notes.length > 0 && (
              <div className="notes">
                {chart.notes.map((note) => (
                  <p key={note} className="notice">{note}</p>
                ))}
              </div>
            )}

            <hr className="rule rule-heavy" />

            <div className="plate-ground">
              <ComparisonPlate comparison={comparison} />
            </div>

            <dl className="readout">
              <div>
                <dt>Universal time</dt>
                <dd>{chart.utc.toISOString().replace('T', ' ').slice(0, 19)}</dd>
              </div>
              <div>
                <dt>Offset applied</dt>
                <dd>{chart.offset.label}</dd>
              </div>
              <div>
                <dt>Julian day</dt>
                <dd>{chart.julianDay.toFixed(5)}</dd>
              </div>
              {comparison.ayanamsas
                .filter((entry) => entry.degrees !== 0)
                .map((entry) => (
                  <div key={entry.systemId}>
                    <dt>{entry.label} ayanamsa</dt>
                    <dd>{entry.degrees.toFixed(4)}°</dd>
                  </div>
                ))}
            </dl>
          </>
        )}
      </div>
    </section>
  )
}
