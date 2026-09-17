/**
 * Three — the frames.
 *
 * Composition: an explanatory plate. A wide lede, then the diagram set between
 * the facing descriptions of the systems, so the figure sits physically
 * between the two things it is about. This is the section that makes the tool
 * worth existing, so it is given the widest measure and the most air.
 *
 * The figure is interleaved after the first card rather than hardcoded between
 * exactly two, so adding a third system flows it sensibly instead of breaking
 * the layout.
 */
import { Fragment } from 'react'

import { OffsetRings } from '../components/Figures'
import { FRAME_EXPLANATIONS } from '../engine/divergence'
import { SYSTEMS, SYSTEM_IDS } from '../engine/systems'

export function Frames({ ayanamsa }: { ayanamsa: number }) {
  return (
    <section id="frames" className="section">
      <div className="shell">
        <span className="plate-number">Three — the frames</span>
        <h2>Why they disagree</h2>

        <p className="measure lede-wide">{FRAME_EXPLANATIONS.ayanamsa}</p>

        <hr className="rule" />

        <div className="frames-spread">
          {SYSTEM_IDS.map((id, index) => (
            <Fragment key={id}>
              <div className="frame-card">
                <h3>{SYSTEMS[id].name}</h3>
                <p className="sub">Zodiac — {SYSTEMS[id].ayanamsaName ?? 'tropical'}</p>
                <p>{SYSTEMS[id].zodiacNote}</p>
                <p className="sub">
                  Houses — {SYSTEMS[id].houseSystem === 'placidus' ? 'Placidus' : 'whole sign'}
                </p>
                <p>{SYSTEMS[id].houseNote}</p>
              </div>
              {index === 0 && <OffsetRings ayanamsa={ayanamsa} />}
            </Fragment>
          ))}
        </div>

        <p className="measure consequence">{FRAME_EXPLANATIONS.consequence}</p>
      </div>
    </section>
  )
}
