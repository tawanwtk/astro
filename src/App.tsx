/**
 * Phase 2: the ugliest possible UI.
 *
 * Deliberately unstyled. Its only job is to prove that real birth data flows
 * through the engine and produces correct numbers on screen, and that the
 * unknown-birth-time path degrades honestly. The design layer comes later and
 * would only have to be redone if the data model moved.
 */
import { useEffect, useState } from 'react'

import { type BirthData, type Chart, computeChart } from './engine/chart'
import { type Place, formatCoordinates, loadPlaces, searchPlaces } from './data/places'

function PlacementTable({ chart }: { chart: Chart }) {
  const rows = [
    ...(chart.tropical.ascendant ? ['ascendant' as const] : []),
    ...chart.tropical.placements.map((p) => p.point),
  ]

  const find = (frame: Chart['tropical'], point: string) =>
    point === 'ascendant'
      ? frame.ascendant
      : frame.placements.find((p) => p.point === point) ?? null

  return (
    <table border={1} cellPadding={4}>
      <thead>
        <tr>
          <th>Body</th>
          <th>Western tropical (Placidus)</th>
          <th>House</th>
          <th>Vedic sidereal (whole sign)</th>
          <th>House</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((point) => {
          const tropical = find(chart.tropical, point)
          const sidereal = find(chart.sidereal, point)
          if (!tropical || !sidereal) return null

          return (
            <tr key={point}>
              <td>{tropical.label}</td>
              <td>
                {tropical.formatted}
                {tropical.retrograde ? ' R' : ''}
              </td>
              <td>{tropical.house ?? 'undefined'}</td>
              <td>
                {sidereal.formatted}
                {sidereal.retrograde ? ' R' : ''}
              </td>
              <td>{sidereal.house ?? 'undefined'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function App() {
  const [places, setPlaces] = useState<Place[]>([])
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState<Place | null>(null)

  const [date, setDate] = useState('1990-06-15')
  const [time, setTime] = useState('09:30')
  const [timeKnown, setTimeKnown] = useState(true)

  const [chart, setChart] = useState<Chart | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadPlaces().then(setPlaces).catch((cause) => setError(String(cause)))
  }, [])

  const matches = searchPlaces(places, query)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!place) {
      setError('Choose a birth place.')
      return
    }

    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.split(':').map(Number)

    const birth: BirthData = {
      local: { year, month, day, hour: hour || 0, minute: minute || 0 },
      timeKnown,
      latitude: place.latitude,
      longitudeEast: place.longitudeEast,
      zone: place.zone,
    }

    setBusy(true)
    try {
      setChart(await computeChart(birth))
    } catch (cause) {
      setError(String(cause))
      setChart(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Divergence</h1>
      <p>Phase 2 — unstyled. Verifying the numbers, not the look.</p>

      <form onSubmit={submit}>
        <p>
          <label>
            Birth date{' '}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </p>

        <p>
          <label>
            <input
              type="checkbox"
              checked={timeKnown}
              onChange={(e) => setTimeKnown(e.target.checked)}
            />{' '}
            I know the birth time
          </label>
        </p>

        {timeKnown && (
          <p>
            <label>
              Birth time (local at the birth place){' '}
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
          </p>
        )}

        <p>
          <label>
            Birth place{' '}
            <input
              type="text"
              value={query}
              placeholder={places.length ? 'Type a city' : 'Loading places...'}
              onChange={(e) => {
                setQuery(e.target.value)
                setPlace(null)
              }}
            />
          </label>
        </p>

        {!place && matches.length > 0 && (
          <ul>
            {matches.map((match) => (
              <li key={`${match.name}-${match.country}-${match.latitude}`}>
                <button
                  type="button"
                  onClick={() => {
                    setPlace(match)
                    setQuery(`${match.name}, ${match.country}`)
                  }}
                >
                  {match.name}, {match.country} —{' '}
                  {formatCoordinates(match.latitude, match.longitudeEast)} — {match.zone}
                </button>
              </li>
            ))}
          </ul>
        )}

        {place && (
          <p>
            Using {place.name}, {place.country}:{' '}
            {formatCoordinates(place.latitude, place.longitudeEast)}, zone {place.zone}
          </p>
        )}

        <p>
          <button type="submit" disabled={busy}>
            {busy ? 'Computing...' : 'Compare'}
          </button>
        </p>
      </form>

      {error && <p>Error: {error}</p>}

      {chart && (
        <section>
          <h2>Result</h2>
          <p>
            UTC instant: {chart.utc.toISOString()} (offset {chart.offset.label}, source{' '}
            {chart.offset.source})
            <br />
            Julian Day: {chart.julianDay.toFixed(6)}
            <br />
            Lahiri ayanamsa: {chart.ayanamsa.toFixed(4)}°
          </p>

          {chart.notes.length > 0 && (
            <ul>
              {chart.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

          <PlacementTable chart={chart} />
        </section>
      )}
    </main>
  )
}
