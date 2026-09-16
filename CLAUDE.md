# CLAUDE.md — Divergence

## What this project is

A client-side birth chart tool that compares Western tropical and
Vedic sidereal placements and marks where they disagree.

Read PROJECT_BRIEF.md for scope and TECHNICAL.md for the
calculation rules before writing code. Read DESIGN_BRIEF.md before
touching anything visual.

## Hard rules

**No backend. No network calls after page load.** No ephemeris API,
no geocoding API, no analytics, no fonts fetched at runtime if it
can be avoided. If a task appears to require a network call, stop
and raise it rather than adding one.

**Birth data never leaves the browser.** No transmission, no
logging, no storage beyond the current session unless explicitly
asked for. This is the project's central claim and it must stay
true.

**Astrology is presented as interpretive.** Never generate
personality descriptions, predictions or advice. The tool describes
systems and shows where they differ. Copy describes traditions, not
people.

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
