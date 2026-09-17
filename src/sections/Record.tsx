/**
 * Two — the record.
 *
 * Composition: a two-column spread on a slightly deeper ground. The written
 * record on the left -- date, time, systems -- and the map on the right, so
 * the section reads as a form being filled against a chart being consulted.
 * At 390px the two stack, record first, because the map is the optional half.
 */
import type { FormEvent } from 'react'

import { LocationPicker, type LocationChoice } from '../components/LocationPicker'
import {
  SYSTEMS, SYSTEM_IDS, type SystemId, THAI_SURIYAYART_NOTE,
} from '../engine/systems'

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

export function Record({
  date, onDate,
  time, onTime,
  timeKnown, onTimeKnown,
  place, onPlace,
  selection, onSelection,
  busy, error, onSubmit,
}: {
  date: string
  onDate: (value: string) => void
  time: string
  onTime: (value: string) => void
  timeKnown: boolean
  onTimeKnown: (value: boolean) => void
  place: LocationChoice | null
  onPlace: (value: LocationChoice | null) => void
  selection: SystemId[]
  onSelection: (value: SystemId[]) => void
  busy: boolean
  error: string | null
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <section id="record" className="section section-deep">
      <div className="shell">
        <span className="plate-number">Two — the record</span>
        <h2>Birth data</h2>
        <p className="measure lede">
          Time is read as local time at the place of birth, and converted using
          the offset in force there on that date.
        </p>

        <form className="record-spread" onSubmit={onSubmit}>
          <div className="record-column">
            <div className="field">
              <label className="label" htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => onDate(event.target.value)}
                required
              />
            </div>

            <div className="checkline">
              <input
                id="time-known"
                type="checkbox"
                checked={!timeKnown}
                onChange={(event) => onTimeKnown(!event.target.checked)}
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
                  onChange={(event) => onTime(event.target.value)}
                />
              </div>
            )}

            <SystemToggles selection={selection} onChange={onSelection} busy={busy} />

            <div className="submit">
              <button type="submit" className="action" disabled={busy}>
                {busy ? 'Computing' : 'Compare the frames'}
              </button>
            </div>

            {error && <p role="alert" className="notice error">{error}</p>}
          </div>

          <div className="record-column record-map">
            <LocationPicker value={place} onChange={onPlace} disabled={busy} />
          </div>
        </form>
      </div>
    </section>
  )
}
