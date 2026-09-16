# PROGRESS

Updated 2026-09-16.

**Live: https://astrodivergence.pages.dev/**

v1 is shipped. Every item in the definition of done is met and
verified against the deployed site.

## Built

| Phase | State |
|---|---|
| 0 — setup | Done. Vite 8, React 19, TypeScript, Tailwind 4, Vitest. |
| 1 — engine | Done. `src/engine/`, verified against reference charts. |
| 2 — ugly UI | Done, then superseded by Phase 4. It did its job: it proved real data flowed through correctly before any design work. |
| 3 — divergence | Done. `src/engine/divergence.ts`. |
| 4 — design | Done. Editorial plate register, five sections, parallax last. |
| 5 — ship | Done. Deployed to Cloudflare Pages. |

## Definition of done

| Requirement | State |
|---|---|
| Birth data in, comparison table out, divergence marked | Met |
| Ascendant correct against two known reference charts | Met — under half an arcminute on both |
| Works at 390px | Met — verified in a real 390px viewport |
| Works with reduced motion | Met — verified functionally, not just in CSS |
| Lighthouse performance ≥ 90 | Met — 96 mobile, 100 desktop |
| Lighthouse accessibility ≥ 90 | Met — 100 |
| Deployed to Cloudflare Pages | Met |
| OG tags in static HTML, absolute image URL, canonical set | Met — confirmed in the served HTML |

## Verified

### Reference charts — actual versus published

Run `npm run verify` to reproduce.

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

Einstein is the pre-standard-time case: the offset must come from the
birth longitude as Local Mean Time. Mandela is the southern hemisphere
case; mutating the latitude sign fails both Ascendant assertions, so
the tests are not vacuous.

### Lahiri ayanamsa — actual versus published tables

| Date | Expected | Actual | Delta |
|---|---|---|---|
| 1900-01-01 | 22.46056° | 22.46053° | 0.1" |
| 1950-01-01 | 23.15861° | 23.15873° | 0.4" |
| 2000-01-01 | 23.85333° | 23.85707° | 13.5" |

The largest delta is 13.5 arcseconds, three orders of magnitude below
anything that could move a sign boundary. Most likely mean-versus-true
nutation between table sources.

### Independent cross-check

Every tropical longitude is asserted against `astronomy-engine`, an
unrelated MIT implementation, within 30 arcseconds. Observed agreement
is about 2.5. Two independent codebases cannot be wrong the same way.

### Lighthouse — against the deployed URL

| | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Mobile | **96** | **100** | 100 | 100 |
| Desktop | **100** | **100** | 100 | 100 |

Mobile: FCP 1.6s, LCP 2.7s, TBT 0ms, CLS 0. Stable at 96 across three
runs. An earlier run returned 99; 96 is the honest repeatable figure.

### The deployed site, checked directly

- Computes correctly live: Mandela's chart through the real form gives
  Ascendant Sagittarius 14°59'55" → Scorpio 22°16'45", ayanamsa
  22°43'10", matching local output exactly.
- **Zero off-origin network requests** during a full session, measured
  by intercepting every request. The central claim holds in practice.
- Zero console errors.
- CSP header live and enforcing `connect-src 'self'`.
- `og.png` serves as a valid PNG at exactly 1200×630.
- Canonical, `og:url` and `og:image` all absolute on
  `astrodivergence.pages.dev`, present in the served static HTML.
- `robots.txt` and `sitemap.xml` serve correctly.
- Long-lived immutable cache headers on `/assets`, `/fonts`, `/wasm`.
- 390px: no horizontal overflow, masthead renders, one `main` landmark.
- `prefers-reduced-motion: reduce`: `animation-name` computes to
  `none`, `animation-timeline` to `auto`, `scroll-behavior` to `auto`.
  Layers render static; the page stays fully readable.

### Contrast

Computed rather than assumed, against the paper ground `#f3eee4`:

| Token | Ratio | Verdict |
|---|---|---|
| `--color-ink` | 15.18:1 | AA normal |
| `--color-ink-soft` | 8.33:1 | AA normal |
| `--color-ink-faint` | 4.84:1 | AA normal |
| `--color-mark` | 7.37:1 | AA normal |

`--color-ink-faint` was originally 3.66:1 and used on 11–13px labels.
Lighthouse scored accessibility 100 with that in place — its contrast
audit samples rather than proves. It is now computed in
`design.test.ts` and fails below 4.5:1.

### Tests

82 passing, covering the engine, the divergence logic, the bundled
assets, the static metadata, and the design constraints from
DESIGN_BRIEF.md — reduced-motion gating, transform-and-opacity-only
keyframes, no remote `url()`, no scroll listener, no WebGL, the CSP,
and contrast.

## Stated explicitly

- **Computed, not hardcoded:** all planetary longitudes, the Ascendant,
  Midheaven, Placidus cusps, the Lahiri ayanamsa, ΔT, timezone offsets,
  and every house assignment.
- **Hardcoded:** the reference chart expectations in
  `reference-charts.ts`, transcribed from published sources — they are
  the point of comparison, not an output. `PLACIDUS_LATITUDE_LIMIT` is
  a deliberate conservative 66.0°, just inside the true polar circle at
  about 66.56°.
- **Approximated:** for births before standard time was adopted at a
  location, the offset is Local Mean Time from the birth longitude.
  That is the correct treatment, but it is a longitude calculation
  rather than a legislated value, and the interface says so on the
  result.
- **Worth naming:** an unknown birth time uses noon local to place the
  slow bodies, then refuses to report the Ascendant or any house in
  either tradition. The signs shown are real; the Moon carries an
  explicit caveat because it moves about half a degree an hour.

## Known limits

Not defects, but true things a reader should know.

- **Placidus is withheld inside the polar circles.** Swiss Ephemeris
  silently substitutes Porphyry there; we decline instead and say why.
  Whole sign is unaffected.
- **Pre-1900 timezone data is approximate by nature.** The IANA
  database carries pre-standard-time offsets as the Local Mean Time of
  each zone's reference city, which is why we recompute from the birth
  longitude instead. For a birth in a place whose local time was set by
  a nearby town clock rather than by its own meridian, the true offset
  could differ by a few minutes.
- **The place list has 7,281 entries.** A small town may not be there.
  Coordinates can be checked against what is shown, but there is no
  manual latitude/longitude entry in the UI yet — the engine supports
  it, the form does not expose it.
- **Lahiri has variants.** We use the standard Indian government value
  (`SE_SIDM_LAHIRI`), not true Chitrapaksha. They differ by under an
  arcminute.

## Deliberately not built, per PROJECT_BRIEF.md

Chinese and Thai systems. Chart wheels. Interpretive text generation.
Accounts, saving, sharing, any backend.

## Possible next

Nothing is required. If it continues:

- Manual latitude/longitude entry in the form.
- A second ayanamsa (Raman, Krishnamurti) as a selector, to show that
  even "the sidereal zodiac" is not one thing.
- The Thai and Chinese engines, as a separate phase.
