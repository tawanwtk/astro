# Divergence

**https://astrodivergence.pages.dev/**

A birth chart tool that shows where astrological traditions
*disagree* with each other.

Enter birth data once. It is read through Western tropical astrology
(Placidus houses) and Vedic sidereal astrology (Lahiri ayanamsa,
whole sign houses), side by side, with every point of disagreement
marked.

The disagreement is the product — not the reading, the gap between
the readings.

## Privacy

Fully client-side. No backend, no API keys, no analytics, no storage.
The ephemeris is bundled and runs in the browser: birth data is
entered, computed and displayed locally and is never transmitted.

One thing does leave, and it is named rather than glossed. The
location picker draws an OpenStreetMap map, and each tile is an image
fetched from OSM's servers, so those requests indicate which square of
the world is on screen. Nothing typed is ever sent — place search
matches a bundled city list in memory, and a dropped pin's time zone
is resolved against that same list, so there is no geocoding request
of any kind. The coordinate entry under the map is a complete path to
a chart and fetches no tiles at all.

## Framing

This tool is interpretive. It is not evidence-based and does not
present itself as such — the readings section says so at its head, at
reading size, not in a collapsed disclaimer.

It does carry readings, and they are lookups rather than generated
prose. Each tradition has fixed tables — planetary nature, sign and
house signification, essential dignity — and the chart indexes them.
Every reading names the tradition it came from and shows the lookups
behind it. Setting them side by side is the point: handed the same
body at the same moment, the two traditions reach for vocabularies
that do not translate, and often disagree about the sign, the house
and the dignity as well.

It makes no claims about people, offers no predictions and gives no
advice. Second-person address, prediction and evaluation of a person
fail the build; the framing tests scan both the tables and everything
generated from them.

## Develop

```sh
npm install
npm run dev        # dev server
npm test           # engine tests against reference charts
npm run build      # static build to dist/
```

## Deploy — Cloudflare Pages

Build settings:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 or later |

`_headers` is copied into `dist` by the build and carries the
Content-Security-Policy, which draws the boundary rather than leaving
it to the source continuing to behave. `img-src` admits the OSM tile
hosts and nothing else; `connect-src` stays `'self'`, so fetch, XHR,
WebSocket and sendBeacon to a third party are blocked by the browser.
Tiles can travel because they are images; birth data has no channel
open to it. `design.test.ts` asserts both halves, and fails if a
second third-party host ever appears in the policy.

The canonical hostname is `https://astrodivergence.pages.dev/`. It is
set in `index.html` (canonical and `og:*`), `public/robots.txt` and
`public/sitemap.xml`. The `og:image` URL must stay absolute -- LinkedIn
and most crawlers do not run JavaScript and will not resolve a relative
one.

## Licence

AGPL-3.0-or-later. This project bundles the Swiss Ephemeris, which is
licensed AGPL-3.0-or-later for open-source use; that obligation
extends to this tool, so the source is public. See `LICENSE`.
