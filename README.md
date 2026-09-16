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

Fully client-side. No backend, no API keys, no network calls after
page load. The ephemeris is bundled and runs in the browser. Birth
data is entered, computed and displayed locally and is never
transmitted anywhere.

## Framing

This tool is interpretive. It is not evidence-based and does not
present itself as such. It describes systems and their assumptions —
it makes no claims about people, offers no predictions and gives no
advice.

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
Content-Security-Policy. `connect-src 'self'` means the no-network
promise is enforced by the browser rather than resting on the source
continuing to contain no fetch call.

The canonical hostname is `https://astrodivergence.pages.dev/`. It is
set in `index.html` (canonical and `og:*`), `public/robots.txt` and
`public/sitemap.xml`. The `og:image` URL must stay absolute -- LinkedIn
and most crawlers do not run JavaScript and will not resolve a relative
one.

## Licence

AGPL-3.0-or-later. This project bundles the Swiss Ephemeris, which is
licensed AGPL-3.0-or-later for open-source use; that obligation
extends to this tool, so the source is public. See `LICENSE`.
