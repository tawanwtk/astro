# CLAUDE.md — Divergence

## What this project is

A client-side birth chart tool that compares Western tropical and
Vedic sidereal placements and marks where they disagree.

Read PROJECT_BRIEF.md for scope and TECHNICAL.md for the
calculation rules before writing code. Read DESIGN_BRIEF.md before
touching anything visual.

## Hard rules

**No backend. One network call after page load, and it is named.**
The location picker fetches map tiles from OpenStreetMap. That is
the only permitted request to a third party, and it is permitted
because a tile request carries a map viewport and nothing else.

Everything else stands: no ephemeris API, no geocoding API, no
reverse-geocoding, no analytics, no fonts fetched at runtime. Place
search matches the bundled city list in memory, and a dropped pin's
time zone is resolved against that same list, so nothing the reader
types is ever transmitted.

The boundary is enforced in `_headers`, not promised in prose:
`img-src` admits the OSM tile hosts, `connect-src` stays `'self'`.
Tiles travel as images; fetch, XHR, WebSocket and sendBeacon to any
third party are blocked by the browser. If a task appears to need a
network call, stop and raise it rather than adding one — and if one
is ever agreed, it goes through this same treatment: named in the
colophon, pinned in the CSP, asserted in `design.test.ts`.

**Birth data never leaves the browser.** No transmission, no
logging, no storage beyond the current session unless explicitly
asked for. This is the project's central claim and it must stay
true.

One honest qualification, which belongs in the colophon and not in
a footnote: the birth *place* is part of birth data, and a reader
who centres the map on it causes tile requests for that area. OSM
learns roughly where the map was looking. It does not learn the
date, the time, the coordinates the chart was computed from, or
that a chart was computed at all — and the coordinate entry under
the map reaches a chart with no tiles fetched. Say this plainly
wherever the privacy claim is made. Never write "nothing leaves
this device" again; it was true once and is not now.

**Astrology is presented as interpretive. Interpretive material is
looked up, never generated.** The tool carries readings, and they
are assembled from fixed per-tradition tables — planetary nature,
sign and house signification, essential dignity — indexed by the
chart. No sentence is written for a particular chart, and each
reading shows the lookups behind it and names the tradition it came
from.

Still never: personality descriptions, predictions, advice, or any
second-person address. Copy describes traditions and placements, not
people. "Jyotiṣa counts an exalted Maṅgala in Karma bhāva a rāja
yoga" is a statement about Jyotiṣa; "you are ambitious" is not, and
fails the build — the framing tests in `divergence.test.ts` and
`readings.test.ts` scan both the tables and everything generated
from them.

The framing is shown, not filed. That astrology is not
evidence-based is stated at the head of the readings section at
reading size, never in a collapsed disclaimer.

**Do not build Chinese or Thai systems in v1.** Do not build chart
wheels. If either seems like a natural next step, note it and move
on.

## Working style

- Correctness of the astronomy comes before the visual layer. A
  beautiful tool with a wrong ascendant is worthless.
- Show verification. When implementing a calculation, check it
  against a known reference chart and report the comparison.
- If a spec decision is ambiguous, ask one short question rather
  than picking and building.
- Flag assumptions explicitly. Say what is computed versus what is
  hardcoded versus what is a placeholder.
- Small commits with real messages.
- Keep PROGRESS.md current: what is built, what is verified, what is
  known-broken, what is next.

## Stack

Vite + React + TypeScript + Tailwind. Static build, Cloudflare Pages.

Match the existing portfolio project's conventions where reasonable
— same tooling, so the muscle memory carries over.

## Definition of done for v1

- Birth data in, comparison table out, divergence marked
- Ascendant correct against at least two known reference charts
- Works at 390px
- Works with reduced motion
- Lighthouse performance and accessibility both >= 90
- Deployed to Cloudflare Pages
- OG tags present in static HTML, absolute image URL, canonical URL
  set (LinkedIn will not run JS)
