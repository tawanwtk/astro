# PROGRESS

Updated 2026-09-17.

**Live: https://astrodivergence.pages.dev/**

v1 is shipped. Every item in the definition of done is met and
verified against the deployed site. Since then: a convergence view,
an N-system engine with toggles, and a researched decision not to
ship Thai — see below.

**Unreleased, built 2026-09-17, not yet deployed.** Three changes:
interpretive readings assembled by lookup, a Leaflet map location
picker, and a restructure from five sections to seven. The map moved
the no-network rule, which has been rewritten rather than quietly
broken — see "The network line moved" below.

## Built

| Phase | State |
|---|---|
| 0 — setup | Done. Vite 8, React 19, TypeScript, Tailwind 4, Vitest. |
| 1 — engine | Done. `src/engine/`, verified against reference charts. |
| 2 — ugly UI | Done, then superseded by Phase 4. It did its job: it proved real data flowed through correctly before any design work. |
| 3 — divergence | Done. `src/engine/divergence.ts`. |
| 4 — design | Done. Editorial plate register, five sections, parallax last. |
| 5 — ship | Done. Deployed to Cloudflare Pages. |
| 6 — readings | Done, not deployed. `src/engine/readings.ts` and `src/engine/dignity.ts`. |
| 7 — map picker | Done, not deployed. `src/components/LocationPicker.tsx`. |
| 8 — seven sections | Done, not deployed. `src/sections/`. |

## Definition of done

| Requirement | State |
|---|---|
| Birth data in, comparison table out, divergence marked | Met |
| Convergence marked as the stronger, distinct finding | Met — separate ink and form, no status semantics |
| Ascendant correct against two known reference charts | Met — under half an arcminute on both |
| Works at 390px | Met — re-verified at 390px after the restructure: zero horizontal overflow, zero elements outside the viewport, all spreads collapse to one column |
| Works with reduced motion | Met for the deployed version. The new Leaflet map disables its zoom, pan and fade animation under `prefers-reduced-motion`, asserted in `design.test.ts`, but that has not been confirmed in a real reduced-motion browser session yet |
| Lighthouse performance ≥ 90 | Met at last deploy — 93 mobile, 100 desktop. **Needs re-measuring**: readings roughly double the DOM and Leaflet adds a 149 kB chunk |
| Lighthouse accessibility ≥ 90 | Met at last deploy — 100. **Needs re-measuring** after the restructure |
| Deployed to Cloudflare Pages | Met for v1; the three 2026-09-17 changes are **not deployed** |
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
- **The place list has 7,281 entries.** A small town may not be there
  by name — but the map now covers the gap: drop a pin anywhere and
  the coordinates are exact, or type them into the coordinate entry
  under the map. Both paths take the time zone from the nearest listed
  place, and the interface reports which place and how far away.
- **A pin far from any listed place borrows a time zone from far
  away.** The distance is always shown, and beyond 150 km the
  interface says the zone may be wrong and suggests setting the place
  by name instead. Mid-ocean and deep-desert pins are where this
  bites.
- **The map needs the network; nothing else does.** If tiles are
  blocked or the connection is down, the picker says so and the
  coordinate entry below it still reaches a chart.
- **Lahiri has variants.** We use the standard Indian government value
  (`SE_SIDM_LAHIRI`), not true Chitrapaksha. They differ by under an
  arcminute.
- **The readings are one recension each.** Western traditional here
  means the Hellenistic scheme as it reaches modern practice through
  Ptolemy; Jyotiṣa means Parāśarī doctrine. Both traditions contain
  schools that would word these entries differently, and the tables
  do not represent them. Each reading names its source so the claim
  stays bounded.
- **Readings cover the seven classical planets and the Ascendant.**
  Nothing is said about aspects, nakṣatras, daśās, or the outer
  planets, because the comparison the tool makes does not extend to
  them.

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

## The network line moved

The project's first rule was no network calls after page load. The
map breaks it, deliberately and with the rule rewritten rather than
quietly ignored.

**What now leaves the browser:** map tile images, fetched from
OpenStreetMap when the picker is used. A tile request tells OSM which
square of the world is on screen, which after a pin drop is a rough
indication of a birth place.

**What still does not:** everything else. The date, the time and the
coordinates are never transmitted. Place search matches the bundled
city list in memory, so a typed place name never goes anywhere, and
a dropped pin's time zone is resolved against that same list — there
is no geocoding request and no reverse-geocoding request.

**What enforces it:** the CSP in `_headers`. `img-src` admits the OSM
tile hosts and nothing else; `connect-src` stays `'self'`, so fetch,
XHR, WebSocket and sendBeacon to a third party are blocked by the
browser. Tiles can travel because they are images. Birth data has no
open channel, whatever the source might one day say.
`design.test.ts` asserts both halves and fails if a second
third-party host ever appears in the policy.

**What was rewritten so nothing claims otherwise:** the colophon (it
used to say "nothing left this device"), the masthead note, CLAUDE.md,
README.md and PROJECT_BRIEF.md. The manual coordinate entry under the
map is a complete path to a chart that fetches no tiles, so a reader
who would rather not touch OSM at all is not shut out.

## Readings — looked up, not generated

Built because this is a personal tool and the interpretive
vocabularies are worth seeing collide. Built as a lookup because
generated prose would have made every other claim in the project
worth less.

`src/engine/dignity.ts` holds the two traditions' schemes of
essential dignity; `src/engine/readings.ts` holds planetary nature,
the tradition's own body and sign names, and the assembly. Sign and
house significations come from the existing `associations.ts`. The
chart indexes the tables and the assembly is mechanical — no sentence
is written for a particular chart, and the page shows the lookups
behind each reading.

Three genuine differences between the schemes are surfaced rather
than flattened, and asserted in `readings.test.ts` so a later edit
cannot quietly harmonise them:

- The exaltation *degree* differs for three bodies. Sun: 19 Aries
  Western, 10 Meṣa Jyotiṣa. Jupiter: 15 Cancer against 5 Karka.
  Saturn: 21 Libra against 20 Tulā. The other four agree.
- Detriment is Western only. Jyotiṣa has no such category, and the
  code returns none rather than inventing an equivalent.
- Mūlatrikoṇa is Jyotiṣa only, and is a degree band inside a ruled
  sign rather than a whole sign.

**Verified against Einstein**, whose chart happens to demonstrate the
point better than an invented example could:

| Body | Western | Jyotiṣa |
|---|---|---|
| Venus | Aries — **detriment** | Mīna — **uccha (exalted)** |
| Saturn | Aries — fall | Mīna — no dignity |
| Moon | Sagittarius — no dignity | Vṛścika — nīca |
| Mercury | Aries — no dignity | Mīna — nīca |
| Mars | Capricorn — exaltation | Makara — uccha |

Venus is the case worth reading: the same body at the same moment is
debilitated in one tradition and exalted in the other. Mars is the
other: both traditions agree on the sign *and* agree it is exalted,
and still put it in a different house (seventh Placidus, eighth whole
sign). Every dignity above was checked by hand against standard
doctrine.

Framing is a standing part of the section, set at its head at reading
size: astrology is not evidence-based, the readings are a lookup, and
the payoff is the vocabularies rather than the verdicts. Not a
collapsed disclaimer.

## Seven sections

Five became seven: masthead, record, frames, comparison,
**convergence**, **readings**, colophon. `src/App.tsx` now holds only
state and ordering; every section is a file in `src/sections/` and
owns its own ground and composition — a title page, a two-column form
with the map, an explanatory plate with the offset-rings figure
between the two system descriptions, the table of record, an inverted
dark commentary, a facing-page parallel text, and end matter.

Two things caught in browser verification rather than by tests:

- **The convergence section overstated its case.** It listed every
  row where either axis agreed, which for the Einstein chart was
  eight of eight — true by the letter, wrong in what it implied.
  Sign agreement and house agreement are now counted and presented
  separately, because they are not the same claim: keeping a sign
  across zodiacs 22.2° apart is rare (3 of 8), while landing in the
  same house is common (5 more) since Placidus and whole sign often
  coincide.
- **The inverted section rendered blank.** It set
  `background-color: var(--color-ink)` in the same rule that
  redefined `--color-ink` to the paper colour for its descendants.
  Custom properties resolve against the element they are used on, so
  it painted paper on paper. Fixed with a separate
  `--color-ground-dark` token, with a test asserting the two stay
  equal.

## Possible next

- **A third system, so the toggles become live.** The cheapest real
  one is a second ayanamsa — Raman or Krishnamurti — which would show
  that even "the sidereal zodiac" is not one thing, and would make the
  convergence view considerably more interesting than it can be with
  two systems.
- Deploy the three unreleased changes, and re-run Lighthouse against
  the deployed site — the readings section roughly doubles the DOM
  when a chart is present, and Leaflet adds 149 kB in its own chunk,
  so the performance number needs re-measuring rather than assuming.
- Thai Suriyayart, once the canon's constants are in hand.
- BaZi, as its own engine with its own display.
