# PROGRESS

Updated 2026-09-16.

## Built

- **Phase 0 — setup.** Vite 8 + React 19 + TypeScript + Tailwind 4
  (`@tailwindcss/vite`), Vitest wired to `src/**/*.test.ts`.
  Production build green. Placeholder page renders.
- OG tags, canonical URL and `twitter:card` present in static
  `index.html` so crawlers that do not run JS still resolve them.

## Verified

- `swisseph-wasm` runs offline under Node and returns correct values
  for the Einstein reference chart (1879-03-14 11:30 LMT, Ulm):
  - Tropical Sun **Pis 23°30'** — matches published.
  - Tropical Ascendant **101.646° = Can 11°39'** — matches published.
  - Lahiri ayanamsa for 1879: **22.170°** — consistent with ~50.3"/yr
    precession against the present-era ~24.2°.
- Cross-checked the same instant against `astronomy-engine`, an
  independent MIT implementation. Agreement within **2.5 arcseconds**
  across Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.

## Known-broken / not yet true

- **Not deployed.** No git remote, no Cloudflare Pages project. The
  Phase 0 requirement to prove the pipeline end to end is *not* met;
  this is waiting on account access.
- **OG URLs are placeholders** pointing at `divergence.pages.dev`.
  They must be corrected once the real hostname exists, and
  `public/og.png` does not exist yet.
- No engine, no UI, no tests with assertions. The Einstein numbers
  above came from a throwaway smoke script, not from the test suite.
  Phase 1 turns them into real tests.

## Hardcoded / placeholder, stated explicitly

- `src/App.tsx` is a placeholder pipeline check, not design work.
- Nothing astrological is computed in the app yet.

## Next

Phase 1 — the engine. Pure TypeScript module plus tests, no UI.
Reference charts: Einstein (Ulm, pre-standard-time LMT), Mandela
(Mvezo, southern hemisphere), a Bangkok chart (UTC+7, BE calendar
note), and a high-latitude chart to force the Placidus-failure path.
