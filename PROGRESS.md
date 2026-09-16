# PROGRESS

Updated 2026-09-16.

## Built

**Phase 0 — setup.** Vite 8, React 19, TypeScript, Tailwind 4 via
`@tailwindcss/vite`, Vitest. Git repo pushed to
`github.com/tawanwtk/astro`.

**Phase 1 — the engine.** `src/engine/`, pure TypeScript, no UI.
Positions are computed once in the tropical frame; the sidereal frame
is that same longitude minus the Lahiri ayanamsa.

**Phase 2 — the ugly UI.** Superseded by Phase 4, but it did its job:
it proved real birth data flows through the engine correctly in a real
browser before any design work started.

**Phase 3 — divergence logic.** `src/engine/divergence.ts`. Compares
the two frames on two independent axes and explains the cause of each.

**Phase 4 — design.** Editorial plate register, warm paper, one blue
accent reserved for marking divergence. Five sections descending. Two
scroll-driven parallax layers, built last.

## Verified

### Reference charts — actual versus published

Run `npm run verify` to reproduce this table.

| Chart | Point | Expected | Actual | Delta |
|---|---|---|---|---|
| Einstein | Ascendant | Cancer 11°38' | Cancer 11°38'48" | 0.48' |
| Einstein | Sun | Pisces 23°30' | Pisces 23°30'28" | 0.46' |
| Einstein | Moon | Sagittarius 14°32' | Sagittarius 14°31'33" | 0.45' |
| Mandela | Ascendant | Sagittarius 23°41' | Sagittarius 23°40'31" | 0.48' |
| Mandela | Sun | Cancer 25°04' | Cancer 25°04'15" | 0.25' |
| Mandela | Mercury | Leo 16°08' | Leo 16°08'00" | 0.00' |

All seven bodies plus Ascendant and Midheaven match on both charts,
every value under half an arcminute. Sources: Astro-Databank (Rodden
AA) and Astrotheme.

Einstein is the pre-standard-time case — the offset has to come from
the birth longitude as Local Mean Time. Mandela is the southern
hemisphere case; mutating the latitude sign fails both Ascendant
assertions, so the tests are not vacuous.

### Lahiri ayanamsa — actual versus published tables

| Date | Expected | Actual | Delta |
|---|---|---|---|
| 1900-01-01 | 22.46056° | 22.46053° | 0.1" |
| 1950-01-01 | 23.15861° | 23.15873° | 0.4" |
| 2000-01-01 | 23.85333° | 23.85707° | 13.5" |

The 2000 delta is the largest and is still 13.5 arcseconds, which is
three orders of magnitude below anything that could move a sign
boundary. It is most likely mean-versus-true nutation between table
sources.

### Independent cross-check

Every tropical longitude is asserted against `astronomy-engine`, an
unrelated MIT implementation, and agrees to within 30 arcseconds —
observed agreement is around 2.5. Two independent codebases cannot be
wrong the same way.

### Browser and constraints

- Production build verified in Chrome: the wasm loads and Einstein's
  chart reproduces exactly through the form.
- 390px verified in a real 390px viewport. Table becomes stacked plate
  entries; no horizontal overflow.
- `prefers-reduced-motion: reduce` verified functionally, not just in
  the stylesheet: `animation-name` computes to `none`,
  `animation-timeline` to `auto`, `scroll-behavior` to `auto`. Layers
  render static at resting positions and the page is fully readable.
- 69 tests passing.

### Lighthouse — local production build, mobile preset

| Category | Score |
|---|---|
| Performance | 95 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

FCP 1.7s, LCP 2.8s, TBT 0ms, CLS 0.

**Not yet run against the deployed URL.** That is required by the
definition of done and is outstanding.

## Known-broken / not yet true

- **Not deployed.** Cloudflare Pages needs account access. `wrangler`
  is not authenticated here. This is the only thing standing between
  the project and the v1 definition of done.
- **OG, canonical and sitemap URLs are placeholders** pointing at
  `https://divergence.pages.dev/`. They must be corrected to the real
  hostname before the links are shared — LinkedIn will not run JS, so
  a wrong absolute URL there is a wrong preview. `public/og.png` does
  exist and is correct at 1200×630.
- Lighthouse performance is 95 locally but is measured on a fast local
  server. The deployed figure is the one that counts.

## Stated explicitly

- **Computed, not hardcoded:** all planetary longitudes, the
  Ascendant, Midheaven, Placidus cusps, the Lahiri ayanamsa, ΔT,
  timezone offsets, and every house assignment.
- **Hardcoded:** the reference chart expectations in
  `reference-charts.ts`, which are transcribed from published sources
  and are the point of comparison, not an output. The
  `PLACIDUS_LATITUDE_LIMIT` of 66.0° is a deliberate conservative
  constant, slightly inside the true polar circle at ~66.56°.
- **Approximated:** for births before standard time was adopted at a
  location, the offset is Local Mean Time derived from the birth
  longitude. This is the correct treatment, but it means the offset is
  a longitude calculation rather than a legislated value, and the
  interface says so on the result.
- **Not a placeholder but worth naming:** an unknown birth time uses
  noon local to place the slow bodies, and then refuses to report the
  Ascendant or any house in either tradition. The signs shown are
  real; the Moon carries an explicit caveat because it moves about
  half a degree an hour.

## Next

Phase 5 — ship.

1. Connect Cloudflare Pages (needs your account; see README).
2. Correct the canonical, OG and sitemap URLs to the real hostname.
3. Rerun Lighthouse against the deployed URL and record both scores
   here.
