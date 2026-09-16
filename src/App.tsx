/**
 * Divergence.
 *
 * Five sections, descending: masthead, record, frames, comparison, colophon.
 * Composition varies between them deliberately -- descending should feel like
 * moving through different places, not past repeated blocks.
 */
import { Fragment, useEffect, useRef, useState } from 'react'

import type { BirthData, Chart } from './engine/chart'
import {
  type Comparison, type ComparisonRow, FRAME_EXPLANATIONS, compareFrames,
} from './engine/divergence'
import {
  DEFAULT_SELECTION, SYSTEMS, SYSTEM_IDS, type SystemId, THAI_SURIYAYART_NOTE,
} from './engine/systems'
import { type Place, formatCoordinates, loadPlaces, searchPlaces } from './data/places'
import { Layers } from './components/Layers'

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

function SystemToggles({
  selection, onChange, busy,
}: {
  selection: SystemId[]
  onChange: (next: SystemId[]) => void
  busy: boolean
}) {
  const toggle = (id: SystemId) => {
    const next = selection.includes(id)
      ? selection.filter((existing) => existing !== id)
      : SYSTEM_IDS.filter((existing) => selection.includes(existing) || existing === id)
    onChange(next)
  }

  // A comparison needs two systems. Two are currently implemented, so every
  // one of them is required and none can be switched off. Saying that is
  // better than presenting a control that silently refuses to move.
  const allRequired = SYSTEM_IDS.length <= 2

  return (
    <fieldset className="toggles" disabled={busy}>
      <legend>Systems compared</legend>
      <div className="toggle-row">
        {SYSTEM_IDS.map((id) => {
          const checked = selection.includes(id)
          // Never let the reader switch off the second-to-last system: with one
          // system there is nothing to compare, and an empty table is a worse
          // answer than a disabled checkbox.
          const locked = checked && selection.length <= 2
          return (
            <label key={id} className={`toggle${checked ? ' on' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={locked}
                onChange={() => toggle(id)}
              />
              <span className="toggle-name">{SYSTEMS[id].name}</span>
              <span className="toggle-meta">
                {SYSTEMS[id].zodiac === 'tropical' ? 'tropical' : SYSTEMS[id].ayanamsaName}
                {' · '}
                {SYSTEMS[id].houseSystem === 'placidus' ? 'Placidus' : 'whole sign'}
              </span>
            </label>
          )
        })}
      </div>
      {allRequired && (
        <p className="toggle-note toggle-locked">
          A comparison needs at least two systems, and two are implemented, so
          both are in use. These become selectable when a third is added.
        </p>
      )}
      <p className="toggle-note">{THAI_SURIYAYART_NOTE}</p>
    </fieldset>
  )
}

function ComparisonPlate({ comparison }: { comparison: Comparison }) {
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

export default function App() {
  const [places, setPlaces] = useState<Place[]>([])
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState<Place | null>(null)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [timeKnown, setTimeKnown] = useState(true)
  const [selection, setSelection] = useState<SystemId[]>(DEFAULT_SELECTION)

  const [chart, setChart] = useState<Chart | null>(null)
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const resultRef = useRef<HTMLElement>(null)
  const lastBirth = useRef<BirthData | null>(null)

  useEffect(() => {
    loadPlaces().then(setPlaces).catch(() => {
      setError('The place list could not be loaded. Coordinates can be entered directly.')
    })
  }, [])

  const matches = place ? [] : searchPlaces(places, query)

  async function run(birth: BirthData, systems: SystemId[], moveFocus: boolean) {
    setBusy(true)
    try {
      // Loaded on demand. The ephemeris and its wasm glue are a third of the
      // JavaScript on the page and nothing needs them until this moment.
      const { computeChart } = await import('./engine/chart')

      const computed = await computeChart(birth, systems)
      setChart(computed)
      setComparison(compareFrames(computed))
      lastBirth.current = birth
      if (moveFocus) requestAnimationFrame(() => resultRef.current?.focus())
    } catch {
      setError('That chart could not be computed. Check the date and try again.')
      setChart(null)
      setComparison(null)
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!place) return setError('Choose a birth place from the list.')
    if (!date) return setError('Enter a birth date.')
    if (timeKnown && !time) {
      return setError('Enter a birth time, or say the time is unknown.')
    }

    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = (time || '12:00').split(':').map(Number)

    await run({
      local: { year, month, day, hour, minute },
      timeKnown,
      latitude: place.latitude,
      longitudeEast: place.longitudeEast,
      zone: place.zone,
    }, selection, true)
  }

  /** Changing the selection recomputes against only the chosen systems. */
  function changeSelection(next: SystemId[]) {
    setSelection(next)
    if (lastBirth.current) void run(lastBirth.current, next, false)
  }

  return (
    <>
      <Layers ayanamsa={comparison?.widestZodiacGap || 24} />

      <main className="shell">
        {/* 1 ----------------------------------------------------- masthead */}
        <section className="masthead">
          <h1>Divergence</h1>
          <p className="premise">
            Western and Vedic astrology read the same sky and frequently
            disagree about what it says. This shows <em>where</em>, and why.
          </p>
          <p className="measure masthead-note">
            Everything is computed in your browser. No birth data is sent
            anywhere, stored, or logged.
          </p>
        </section>

        {/* 2 ------------------------------------------------------- record */}
        <section id="record" className="band">
          <span className="plate-number">One — the record</span>
          <h2>Birth data</h2>
          <p className="measure lede">
            Time is read as local time at the place of birth, and converted
            using the offset in force there on that date.
          </p>

          <form className="record" onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="checkline">
              <input
                id="time-known"
                type="checkbox"
                checked={!timeKnown}
                onChange={(event) => setTimeKnown(!event.target.checked)}
              />
              <label htmlFor="time-known">The birth time is unknown</label>
            </div>

            {timeKnown && (
              <div className="field">
                <label className="label" htmlFor="time">Time</label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="place">Place</label>
              <div>
                <input
                  id="place"
                  type="text"
                  autoComplete="off"
                  value={query}
                  placeholder={places.length ? 'Start typing a city' : 'Loading places…'}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPlace(null)
                  }}
                />
                {matches.length > 0 && (
                  <ul className="suggestions">
                    {matches.map((match) => (
                      <li key={`${match.name}-${match.country}-${match.latitude}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setPlace(match)
                            setQuery(`${match.name}, ${match.country}`)
                          }}
                        >
                          {match.name}, {match.country}
                          <span className="meta">
                            {formatCoordinates(match.latitude, match.longitudeEast)} ·{' '}
                            {match.zone}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {place && (
                  <span className="meta chosen">
                    {formatCoordinates(place.latitude, place.longitudeEast)} · {place.zone}
                  </span>
                )}
              </div>
            </div>

            <SystemToggles selection={selection} onChange={changeSelection} busy={busy} />

            <div className="submit">
              <button type="submit" className="action" disabled={busy}>
                {busy ? 'Computing' : 'Compare the frames'}
              </button>
            </div>

            {error && <p role="alert" className="notice error">{error}</p>}
          </form>
        </section>

        {/* 3 ------------------------------------------------------- frames */}
        <section id="frames" className="band">
          <span className="plate-number">Two — the frames</span>
          <h2>Why they disagree</h2>

          <p className="measure lede-wide">{FRAME_EXPLANATIONS.ayanamsa}</p>

          <hr className="rule" />

          <div className="frames-grid">
            {SYSTEM_IDS.map((id) => (
              <div className="frame-card" key={id}>
                <h3>{SYSTEMS[id].name}</h3>
                <p className="sub">Zodiac — {SYSTEMS[id].ayanamsaName ?? 'tropical'}</p>
                <p>{SYSTEMS[id].zodiacNote}</p>
                <p className="sub">
                  Houses — {SYSTEMS[id].houseSystem === 'placidus' ? 'Placidus' : 'whole sign'}
                </p>
                <p>{SYSTEMS[id].houseNote}</p>
              </div>
            ))}
          </div>

          <p className="measure consequence">{FRAME_EXPLANATIONS.consequence}</p>
          <p className="measure consequence">{FRAME_EXPLANATIONS.convergence}</p>
        </section>

        {/* 4 --------------------------------------------------- comparison */}
        <section
          id="comparison"
          ref={resultRef}
          tabIndex={-1}
          aria-live="polite"
          className="band"
        >
          <span className="plate-number">Three — the comparison</span>

          {!comparison && (
            <>
              <h2>The comparison</h2>
              <p className="measure lede">
                Enter birth data above and the readings appear here side by side,
                with every difference and every agreement marked.
              </p>
            </>
          )}

          {comparison && chart && (
            <>
              <h2>Where they meet and part</h2>

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
        </section>

        {/* 5 ----------------------------------------------------- colophon */}
        <footer className="colophon">
          <hr className="rule" />
          <span className="plate-number">Four — colophon</span>
          <h2>What this is</h2>

          <p>
            A comparison of systems of astrology, shown through one set of birth
            data. It reports where the systems agree and where they do not, and
            explains the mechanism behind each.
          </p>

          <p>{FRAME_EXPLANATIONS.interpretive}</p>

          <p>
            <strong>Nothing left this device.</strong> Positions are computed in
            your browser by a bundled copy of the Swiss Ephemeris. The place
            list is bundled too, so looking up a city makes no request. There is
            no backend, no analytics, no storage, and no network call after the
            page loads.
          </p>

          <p className="fineprint">
            Positions from the Swiss Ephemeris, computed once in the tropical
            frame and read through each system&rsquo;s own zodiac and house
            rule. Verified against published reference charts to under one
            arcminute.
          </p>
        </footer>
      </main>
    </>
  )
}
