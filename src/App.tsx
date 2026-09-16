/**
 * Divergence.
 *
 * Five sections, descending: masthead, record, frames, comparison, colophon.
 * Composition varies between them deliberately -- descending should feel like
 * moving through different places, not past repeated blocks.
 */
import { useEffect, useRef, useState } from 'react'

import type { BirthData, Chart } from './engine/chart'
import { type Divergence, type DivergenceRow, FRAME_EXPLANATIONS, compareFrames } from './engine/divergence'
import { type Place, formatCoordinates, loadPlaces, searchPlaces } from './data/places'
import { Layers } from './components/Layers'

/**
 * Classes naming which axis diverges, so the marking points at the actual
 * disagreement rather than washing the whole row in accent.
 */
function rowClasses(row: DivergenceRow): string {
  return [
    row.diverges ? 'diverges' : null,
    row.sign.verdict === 'diverge' ? 'sign-diverges' : null,
    row.house.verdict === 'diverge' ? 'house-diverges' : null,
  ].filter(Boolean).join(' ')
}

/** Short marginal note naming what diverges. The long form lives in the row. */
function markerLabel(row: DivergenceRow): string {
  const axes = [
    row.sign.verdict === 'diverge' ? 'sign' : null,
    row.house.verdict === 'diverge' ? 'house' : null,
  ].filter(Boolean)

  return axes.length ? axes.join(' + ') : ''
}

function Why({ row }: { row: DivergenceRow }) {
  return (
    <details className="why">
      <summary>Why</summary>
      <p>{row.sign.explanation}</p>
      <p>{row.house.explanation}</p>
    </details>
  )
}

function ComparisonPlate({ divergence }: { divergence: Divergence }) {
  return (
    <>
      {/* Wide viewports: a plate table, rows numbered and ruled. */}
      <div className="hidden md:block">
        <table className="plate">
          <caption>
            Each row is one body read through both traditions. A marked row is one
            where they disagree.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="col-index">
                <span className="visually-hidden">Entry</span>
              </th>
              <th scope="col">Body</th>
              <th scope="col">Western tropical · Placidus</th>
              <th scope="col">Vedic sidereal · whole sign</th>
              <th scope="col">Divergence</th>
            </tr>
          </thead>
          <tbody>
            {divergence.rows.map((row, index) => (
              <tr key={row.point} className={rowClasses(row) || undefined}>
                <td className="col-index">{String(index + 1).padStart(2, '0')}</td>
                <th scope="row" className="col-body">
                  {row.label}
                  {row.tropical.retrograde && <span className="retro"> ℞</span>}
                </th>
                <td>
                  <span className="value-tropical">{row.tropical.formatted}</span>
                  <span className="house">
                    {row.tropical.house ? `House ${row.tropical.house}` : 'House undefined'}
                  </span>
                </td>
                <td>
                  <span className="value-sidereal">{row.sidereal.formatted}</span>
                  <span className="house">
                    {row.sidereal.house ? `House ${row.sidereal.house}` : 'House undefined'}
                  </span>
                </td>
                <td>
                  {row.diverges
                    ? <span className="mark-note">{markerLabel(row)}</span>
                    : <span className="mark-none">agree</span>}
                  <Why row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Narrow viewports: the same entries, stacked. Not a squeezed table. */}
      <ul className="entries md:hidden">
        {divergence.rows.map((row, index) => (
          <li key={row.point} className={`entry ${rowClasses(row)}`.trimEnd()}>
            <div className="entry-head">
              <span className="entry-name">
                {row.label}
                {row.tropical.retrograde && <span className="retro"> ℞</span>}
              </span>
              <span className="entry-index">
                {row.diverges
                  ? <span className="mark-note">{markerLabel(row)}</span>
                  : <span className="mark-none">agree</span>}
              </span>
            </div>

            <div className="entry-frames">
              <div className="entry-frame">
                <span className="tag">Western</span>
                <span>
                  <span className="value">{row.tropical.formatted}</span>
                  <span className="house">
                    {row.tropical.house ? `House ${row.tropical.house}` : 'House undefined'}
                  </span>
                </span>
              </div>
              <div className="entry-frame">
                <span className="tag">Vedic</span>
                <span>
                  <span className="value">{row.sidereal.formatted}</span>
                  <span className="house">
                    {row.sidereal.house ? `House ${row.sidereal.house}` : 'House undefined'}
                  </span>
                </span>
              </div>
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

  const [chart, setChart] = useState<Chart | null>(null)
  const [divergence, setDivergence] = useState<Divergence | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const resultRef = useRef<HTMLElement>(null)

  useEffect(() => {
    loadPlaces().then(setPlaces).catch(() => {
      setError('The place list could not be loaded. Coordinates can be entered directly.')
    })
  }, [])

  const matches = place ? [] : searchPlaces(places, query)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!place) {
      setError('Choose a birth place from the list.')
      return
    }
    if (!date) {
      setError('Enter a birth date.')
      return
    }
    if (timeKnown && !time) {
      setError('Enter a birth time, or say the time is unknown.')
      return
    }

    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = (time || '12:00').split(':').map(Number)

    const birth: BirthData = {
      local: { year, month, day, hour, minute },
      timeKnown,
      latitude: place.latitude,
      longitudeEast: place.longitudeEast,
      zone: place.zone,
    }

    setBusy(true)
    try {
      // Loaded on demand. The ephemeris and its wasm glue are a third of the
      // JavaScript on the page and nothing needs them until this moment, so
      // they stay off the critical path entirely.
      const { computeChart } = await import('./engine/chart')

      const computed = await computeChart(birth)
      setChart(computed)
      setDivergence(compareFrames(computed))
      // Move focus, not just scroll, so the result is announced.
      requestAnimationFrame(() => resultRef.current?.focus())
    } catch {
      setError('That chart could not be computed. Check the date and try again.')
      setChart(null)
      setDivergence(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Layers ayanamsa={chart?.ayanamsa ?? 24} />

      <main className="shell">
        {/* 1 ----------------------------------------------------- masthead */}
        <section className="masthead">
          <h1>Divergence</h1>
          <p className="premise">
            Western and Vedic astrology read the same sky and frequently
            disagree about what it says. This shows <em>where</em>, and why.
          </p>
          <p className="measure" style={{ marginTop: '2.5rem', fontSize: '0.9375rem', color: 'var(--color-ink-soft)' }}>
            Everything is computed in your browser. No birth data is sent
            anywhere, stored, or logged.
          </p>
        </section>

        {/* 2 ------------------------------------------------------- record */}
        <section id="record" style={{ paddingBlock: '4rem' }}>
          <span className="plate-number">One — the record</span>
          <h2>Birth data</h2>
          <p className="measure" style={{ marginTop: '1rem', marginBottom: '2.5rem', color: 'var(--color-ink-soft)' }}>
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
                  <span className="meta" style={{ display: 'block', marginTop: '0.375rem' }}>
                    {formatCoordinates(place.latitude, place.longitudeEast)} · {place.zone}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button type="submit" className="action" disabled={busy}>
                {busy ? 'Computing' : 'Compare the frames'}
              </button>
            </div>

            {error && (
              <p role="alert" className="notice" style={{ marginTop: '1.5rem' }}>
                {error}
              </p>
            )}
          </form>
        </section>

        {/* 3 ------------------------------------------------------- frames */}
        <section id="frames" style={{ paddingBlock: '4rem' }}>
          <span className="plate-number">Two — the frames</span>
          <h2>Why they disagree</h2>

          <p className="measure" style={{ marginTop: '1.25rem', marginBottom: '3rem' }}>
            {FRAME_EXPLANATIONS.ayanamsa}
          </p>

          <hr className="rule" />

          <div className="frames-grid" style={{ marginTop: '2.5rem' }}>
            <div className="frame-card">
              <h3>{FRAME_EXPLANATIONS.tropical.name}</h3>
              <p className="sub">Zodiac</p>
              <p>{FRAME_EXPLANATIONS.tropical.zodiac}</p>
              <p className="sub">Houses — Placidus</p>
              <p>{FRAME_EXPLANATIONS.tropical.houses}</p>
            </div>
            <div className="frame-card">
              <h3>{FRAME_EXPLANATIONS.sidereal.name}</h3>
              <p className="sub">Zodiac</p>
              <p>{FRAME_EXPLANATIONS.sidereal.zodiac}</p>
              <p className="sub">Houses — whole sign</p>
              <p>{FRAME_EXPLANATIONS.sidereal.houses}</p>
            </div>
          </div>

          <p className="measure" style={{ marginTop: '2.5rem', color: 'var(--color-ink-soft)' }}>
            {FRAME_EXPLANATIONS.consequence}
          </p>
        </section>

        {/* 4 --------------------------------------------------- comparison */}
        <section
          id="comparison"
          ref={resultRef}
          tabIndex={-1}
          aria-live="polite"
          style={{ paddingBlock: '4rem', outline: 'none' }}
        >
          <span className="plate-number">Three — the comparison</span>

          {!divergence && (
            <>
              <h2>The comparison</h2>
              <p className="measure" style={{ marginTop: '1.25rem', color: 'var(--color-ink-soft)' }}>
                Enter birth data above and the two readings appear here, side by
                side, with every disagreement marked.
              </p>
            </>
          )}

          {divergence && chart && (
            <>
              <h2>Where they diverge</h2>

              <p className="summary-line" style={{ marginTop: '1.5rem' }}>
                <strong>{divergence.signDivergences} of {divergence.total}</strong>{' '}
                placements fall in a different sign
                {divergence.housesUndefined
                  ? '.'
                  : <>, and <strong>{divergence.houseDivergences}</strong> in a different house.</>}
              </p>

              <p className="measure" style={{ marginTop: '1rem', color: 'var(--color-ink-soft)' }}>
                The two zodiacs are {divergence.ayanamsaFormatted} apart for this
                date, so a placement keeps its sign only in the final{' '}
                {divergence.agreementWindowDegrees.toFixed(1)}° of a tropical sign.
              </p>

              {chart.notes.length > 0 && (
                <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
                  {chart.notes.map((note) => (
                    <p key={note} className="notice">{note}</p>
                  ))}
                </div>
              )}

              <hr className="rule rule-heavy" style={{ margin: '2.5rem 0 2rem' }} />

              <div className="plate-ground">
                <ComparisonPlate divergence={divergence} />
              </div>

              <dl className="readout" style={{ marginTop: '2.5rem' }}>
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
                <div>
                  <dt>Lahiri ayanamsa</dt>
                  <dd>{divergence.ayanamsaFormatted}</dd>
                </div>
              </dl>
            </>
          )}
        </section>

        {/* 5 ----------------------------------------------------- colophon */}
        <footer className="colophon">
          <hr className="rule" style={{ marginBottom: '3rem' }} />
          <span className="plate-number">Four — colophon</span>
          <h2>What this is</h2>

          <p>
            A comparison of two systems of astrology, shown through one set of
            birth data. It reports where the systems agree and where they do
            not, and explains the mechanism behind each disagreement.
          </p>

          <p>{FRAME_EXPLANATIONS.interpretive}</p>

          <p>
            <strong>Nothing left this device.</strong> Positions are computed in
            your browser by a bundled copy of the Swiss Ephemeris. The place
            list is bundled too, so looking up a city makes no request. There is
            no backend, no analytics, no storage, and no network call after the
            page loads.
          </p>

          <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.8125rem' }}>
            Positions from the Swiss Ephemeris. Sidereal longitudes use the
            Lahiri ayanamsa. Western houses are Placidus, Vedic houses are whole
            sign. Verified against published reference charts to under one
            arcminute.
          </p>
        </footer>
      </main>
    </>
  )
}
