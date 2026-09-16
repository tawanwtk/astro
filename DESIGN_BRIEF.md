# DESIGN BRIEF — Divergence

## Direction

Editorial, printed, considered. The reference register is an
astronomical plate or a scientific atlas — something that documents
a system rather than something that sells a reading.

This is deliberately the opposite of the category. Astrology sites
are purple gradients, glowing sigils, stars on a night sky, mystical
serif in gold. Do none of that. A tool whose entire premise is
"these systems disagree, here is the evidence" must look like a
document, not a divination app.

Warm paper ground. Dark ink. One restrained accent used only to mark
divergence. Generous margins. Type doing the work.

## The descent

The page is a vertical descent, and the structure earns it — a birth
chart *is* a vertical stack, from the outer frame down to the
individual placement.

Built with CSS scroll-driven animations and transforms only.

- **Far layer** — large celestial geometry: concentric rings,
  ecliptic arcs, degree ticks. Heavily faded. Moves slowest. Texture,
  never content.
- **Mid layer** — the zodiac band, the two ayanamsa reference frames
  drawn as offset rings. Partial opacity, middle rate. This is where
  the *idea* of the tool is visible before a word is read.
- **Near layer** — type, input, results. At or near scroll rate,
  fully legible at all times.

The reader should feel they are descending through frames of
reference. Masthead at the top, input, then the comparison arriving
below.

## Sections

Not a form followed by a table.

1. **Masthead** — the premise, stated in one or two lines. What this
   is and why the disagreement matters.
2. **Input** — birth data. Quiet, well set, not a wall of fields.
   This is the only thing the reader must do; make it feel like
   filling in a record, not clearing a checkpoint.
3. **The frames** — before results, a short section explaining the
   two systems and why they diverge. Illustrated with the offset
   rings from the mid layer. This is the part that makes the tool
   worth existing.
4. **The comparison** — the table. Each row a body, columns for each
   tradition, the divergence marked. Rows should feel like plate
   entries: numbered, ruled, set with care.
5. **Colophon** — what this is, what it isn't, that nothing left the
   device.

Vary composition between sections. Descending should feel like
moving through different places, not past repeated blocks.

## The divergence marker

This is the most important design decision in the project.

Where two traditions agree, the row is quiet. Where they disagree,
the row is marked — and the marking should feel like an annotation
on a document, not an error state. Divergence is the interesting
case, not the failure case. Do not use red. Do not use warning
iconography.

A marginal rule, a shift in ink weight, a drafting-style leader line
connecting the two differing values — any of these are the right
register.

## Constraints

- Lighthouse performance and accessibility both >= 90. Parallax is
  not an excuse.
- WCAG 2.1 AA. Contrast on the paper ground must be checked, not
  assumed.
- `prefers-reduced-motion`: no parallax, no drift. Layers render
  static at resting positions; the page stays fully readable and
  navigable.
- 390px: parallax collapses to a clean stacked layout. It must work
  properly there, not merely not break. Assume most readers arrive
  on a phone.
- No Three.js, no WebGL, no scroll-hijacking. Native scroll stays
  native — never intercept, ease or take over the reader's scroll.
- Never animate layout properties. Transforms and opacity only.

## The bar

A reader should scroll once and want to keep going. If it reads as a
form with decoration applied, it hasn't worked.
