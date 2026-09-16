# START HERE

Build order. Do not skip ahead to the visual layer — a beautiful
tool with a wrong ascendant is worthless, and the design work will
have to be redone anyway if the data model changes.

## Phase 0 — setup

Vite + React + TypeScript + Tailwind. Git repo. Cloudflare Pages
project connected. Deploy an empty page and confirm the pipeline
works end to end before writing any real code.

## Phase 1 — the engine

No UI. A pure TypeScript module and a test file.

Input: date, time, timezone offset, latitude, longitude.
Output: a structured object with tropical and sidereal placements
and house positions for both systems.

Ends when the reference charts in TECHNICAL.md pass as tests, with
actual-versus-expected reported in degrees.

## Phase 2 — the ugliest possible UI

Unstyled form, unstyled table. Verify real birth data flows through
and produces correct output. Confirm the unknown-birth-time path
degrades honestly.

Ends when the numbers are right on screen.

## Phase 3 — the divergence logic

Compare the two frames per body. Mark agreement and disagreement.
Write the plain-language explanation of *why* each class of
divergence happens — sign shift from ayanamsa, house shift from
Placidus versus whole sign.

This is the actual product. Give it real thought rather than
treating it as a formatting step.

## Phase 4 — design

Now read DESIGN_BRIEF.md properly and build the descent.

Type, palette and layout first. Parallax last — it is the easiest
thing to add and the easiest thing to get wrong, and the page must
be good without it.

## Phase 5 — ship

- 390px verified on a real viewport
- `prefers-reduced-motion` verified
- Lighthouse against the deployed URL, both scores recorded in
  PROGRESS.md
- OG tags in static HTML with an absolute image URL
- Deployed

## First message back to me

Before writing code, report:

1. Which ephemeris library you chose and the trade-off you weighed
2. Anything in the briefs that is ambiguous or that you disagree with
3. The reference charts you intend to validate against

Then start Phase 0.
