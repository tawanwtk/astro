# PROGRESS

Updated 2026-09-16.

**Live: https://astrodivergence.pages.dev/**

v1 is shipped. Every item in the definition of done is met and
verified against the deployed site. Since then: a convergence view,
an N-system engine with toggles, and a researched decision not to
ship Thai — see below.

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
| Convergence marked as the stronger, distinct finding | Met — separate ink and form, no status semantics |
| Ascendant correct against two known reference charts | Met — under half an arcminute on both |
| Works at 390px | Met — verified in a real 390px viewport |
| Works with reduced motion | Met — verified functionally, not just in CSS |
| Lighthouse performance ≥ 90 | Met — 93 mobile, 100 desktop |
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
| Mobile | **93** | **100** | 100 | 100 |
| Desktop | **100** | **100** | 100 | 100 |

Mobile was 96 before the convergence work and is 93 after it — the
comparison table roughly doubled in markup and the stylesheet grew.
Still comfortably over the 90 floor, and recorded as it is rather
than as the better earlier figure.

### The deployed site, checked directly

- Computes correctly live, and the convergence view with it: Einstein's
  chart through the real form reports 5 of 8 signs differing and 3
  agreeing, 1 house differing and 7 agreeing, with attributed
  associations rendered on every converging row.
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
| `--color-mark` (divergence) | 7.37:1 | AA normal |
| `--color-meet` (convergence) | 6.63:1 | AA normal |

`--color-ink-faint` was originally 3.66:1 and used on 11–13px labels.
Lighthouse scored accessibility 100 with that in place — its contrast
audit samples rather than proves. It is now computed in
`design.test.ts` and fails below 4.5:1.

### Tests

93 passing, covering the engine, the comparison logic, convergence and
divergence on both axes, system selection, the bundled assets, the
static metadata, and the design constraints from DESIGN_BRIEF.md —
reduced-motion gating, transform-and-opacity-only keyframes, no remote
`url()`, no scroll listener, no WebGL, the CSP, and contrast.

The framing constraint from PROJECT_BRIEF.md is enforced rather than
trusted. Every association and every generated explanation is scanned
for second person, prediction, advice, personality claims and
evaluative language. Injecting "Aries means that you are assertive,
and your personality will tend toward initiative" into one association
fails the suite, so the guard is not vacuous.

### Convergence

Both findings are computed per axis, independently, because sign and
house have different causes. A row can converge on one and diverge on
the other — Einstein's Mars keeps its sign across both systems and
changes house — and a model that forced one verdict per row would have
to misreport one axis.

| Chart | Sign differs / agrees | House differs / agrees |
|---|---|---|
| Einstein | 5 / 3 | 1 / 7 |
| Mandela | 6 / 2 | 4 / 4 |

Convergence is styled as a finding, never as a pass: sepia ink with a
solid tie and a bracketed marginal rule, against divergence's blue
pencil with a dotted leader line. No green, no red, no icons.

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

## Thai Suriyayart — researched, not shipped, and why

Thai astrology was scoped as a third column on the assumption that it
is Vedic with a different ayanamsa. **It is not, and the evidence is
unambiguous.**

Thai practice does read a sidereal zodiac with whole sign houses
counted from the lagna, which is what makes the assumption look safe.
But traditional Thai positions come from the Suriyayart canon
(คัมภีร์สุริยยาตร์), a mean-motion theory in the Surya Siddhanta lineage
that computes its own longitudes rather than reinterpreting modern
ones.

Published Thai almanac values (สมผุส) against Vedic/Lahiri for the
same instants, two dates a year apart:

| Body | 2025-07-01 | 2026-07-01 |
|---|---|---|
| Sun | −0.26° | −0.25° |
| Jupiter | +0.65° | +0.44° |
| Moon | +0.58° | +2.42° |
| Mars | −2.02° | −1.18° |
| Venus | −3.29° | −2.63° |
| Mercury | −4.80° | **−20.91°** |
| Saturn | **−5.69°** | **−5.54°** |

A single ayanamsa would make that column a constant. Instead the
implied offset spans 6.4° on one date and 23° on the other. The
deviations are structural, not noise — Saturn sits about 5.6° behind
on both dates, and Mercury, the hardest body to model, swings wildly.
That per-planet signature is the fingerprint of a Surya Siddhanta
derived theory.

**How far the implementation got.** The lineage is confirmed: the Thai
year of 292207/800 = 365.25875 days is exactly the Surya Siddhanta
sidereal year, and a Surya Siddhanta solar model reproduces the Thai
almanac Sun to 0.34° on both dates, consistently. The Moon and the
five star-planets do not reproduce — errors of 3° to 25°, and the
residual is not a fixed epoch shift, so it is not a time-offset bug.
The Thai recension's lunar and planetary constants differ from the
Sanskrit ones and are published in printed Thai manuscripts
(the พระยาโหราธิบดี and บุนนาค ทองเนียม editions) rather than anywhere
reachable online.

**Why nothing shipped.** A Thai column several signs wrong would be
worse than no Thai column, and it is exactly the failure this tool
exists to avoid. The architecture is ready — `systems.ts` is a list,
and the engine already takes any selection — but a system that
computes its own positions needs its own ephemeris, not an entry in
that list.

**To finish it:** obtain the Suriyayart canon's มัธยม constants for the
Moon and the five star-planets, implement the mean-motion theory
alongside the Swiss Ephemeris rather than derived from it, and
validate against the published almanac to arcminutes as the other
reference charts are validated.

## Chinese BaZi — a separate engine, not a column

BaZi (八字) has no planetary axis at all. It is built from the
sexagenary cycle — four pillars of heavenly stem and earthly branch
for year, month, day and hour — derived from a lunisolar calendar and
solar terms, not from ecliptic longitude. There is no sign to compare
and no house to compare, so it cannot share a row with the systems in
this table however the table is arranged.

It needs its own engine and its own display, and the interesting
comparison against Western and Vedic would be a different question
than the one this table asks. Deliberately out of scope here.

## Deliberately not built, per PROJECT_BRIEF.md

Chart wheels. Interpretive text generation. Accounts, saving,
sharing, any backend.

## Possible next

- **A third system, so the toggles become live.** The cheapest real
  one is a second ayanamsa — Raman or Krishnamurti — which would show
  that even "the sidereal zodiac" is not one thing, and would make the
  convergence view considerably more interesting than it can be with
  two systems.
- Manual latitude/longitude entry in the form. The engine supports it;
  the form does not expose it.
- Thai Suriyayart, once the canon's constants are in hand.
- BaZi, as its own engine with its own display.
