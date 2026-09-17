/**
 * One — the masthead.
 *
 * Composition: a full-height title page. Nothing but type, set against the
 * parallax layers, with no rules and no boxes. It is the only section that
 * asks nothing of the reader, and it should read as the cover of a document
 * rather than the top of a form.
 */
export function Masthead() {
  return (
    <section className="section masthead">
      <div className="shell">
        <h1>Divergence</h1>
        <p className="premise">
          Western and Vedic astrology read the same sky and frequently disagree
          about what it says. This shows <em>where</em>, and why.
        </p>
        <p className="measure masthead-note">
          Birth data is computed in your browser and never transmitted. The map
          fetches its tiles from OpenStreetMap; nothing you type is sent
          anywhere.
        </p>
        <p className="masthead-descend" aria-hidden="true">
          <span className="descend-rule" />
          <span className="descend-word">Descend</span>
        </p>
      </div>
    </section>
  )
}
