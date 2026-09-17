/**
 * Divergence.
 *
 * Seven sections, descending: masthead, record, frames, comparison,
 * convergence, readings, colophon. Each one owns its own ground and its own
 * composition -- a title page, a two-column form, an explanatory plate, a
 * table of record, an inverted commentary, a parallel text, and end matter --
 * so that descending reads as moving through places rather than past repeated
 * blocks.
 *
 * App itself holds the state and does no layout beyond ordering the sections.
 * Everything visual lives in `src/sections`, which is also what the design
 * tests sweep.
 *
 * Scroll is never touched. There is no scroll listener, no wheel handler and
 * no scroll library anywhere in this file or under it; the parallax is CSS
 * scroll-driven animation, gated behind `prefers-reduced-motion`, and the
 * map's own wheel zoom is switched off so it cannot swallow the page either.
 */
import { useRef, useState } from 'react'

import type { BirthData, Chart } from './engine/chart'
import { type Comparison, compareFrames } from './engine/divergence'
import { DEFAULT_SELECTION, type SystemId } from './engine/systems'
import type { LocationChoice } from './components/LocationPicker'
import { Layers } from './components/Layers'

import { Masthead } from './sections/Masthead'
import { Record } from './sections/Record'
import { Frames } from './sections/Frames'
import { Comparison as ComparisonSection } from './sections/Comparison'
import { Convergence } from './sections/Convergence'
import { Readings } from './sections/Readings'
import { Colophon } from './sections/Colophon'

/** The Lahiri ayanamsa is near enough 24° for the figure before a chart exists. */
const NOMINAL_AYANAMSA = 24

export default function App() {
  const [place, setPlace] = useState<LocationChoice | null>(null)
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

  // Note that nothing here scrolls the page. On submit the results section is
  // focused, which lets the browser bring it into view by its own rules and
  // announces it to a screen reader; where the reader ends up is then theirs
  // to change. A programmatic scroll would be the tool taking the wheel.
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

    if (!place) {
      return setError('Choose a birth place — search for it, place a pin, or enter coordinates.')
    }
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

  const ayanamsa = comparison?.widestZodiacGap || NOMINAL_AYANAMSA

  return (
    <>
      <Layers ayanamsa={ayanamsa} />

      <main className="descent">
        <Masthead />

        <Record
          date={date} onDate={setDate}
          time={time} onTime={setTime}
          timeKnown={timeKnown} onTimeKnown={setTimeKnown}
          place={place} onPlace={setPlace}
          selection={selection} onSelection={changeSelection}
          busy={busy} error={error} onSubmit={submit}
        />

        <Frames ayanamsa={ayanamsa} />

        <ComparisonSection chart={chart} comparison={comparison} resultRef={resultRef} />

        <Convergence comparison={comparison} />

        <Readings comparison={comparison} />

        <Colophon />
      </main>
    </>
  )
}
