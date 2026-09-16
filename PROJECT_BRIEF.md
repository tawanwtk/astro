# DIVERGENCE — project brief

A birth chart tool that shows where astrological traditions
*disagree* with each other.

Every astrology site on the internet picks one tradition and speaks
with its voice. Enter your birth data, receive an answer. The answer
is delivered as fact.

But run the same birth data through Western tropical astrology and
through Vedic sidereal astrology and you frequently get a different
Sun sign, a different rising sign, different house placements for the
same planet. Both traditions are internally coherent. Both have
centuries of practice behind them. They disagree because they are
built on different reference frames, not because one made an
arithmetic error.

**That disagreement is the product.** Not the reading — the gap
between the readings.

## What it does

The reader enters birth date, time and place. The tool computes
planetary positions once, then presents them through two
interpretive frames side by side, and marks every point where the
frames diverge.

The output is a comparison, not a verdict.

## Scope for v1

**In:**

- Western tropical — Placidus houses
- Vedic sidereal — Lahiri ayanamsa, whole sign houses
- Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Ascendant
- Sign placement and house placement for each
- An explicit divergence marker per row
- A plain-language explanation of *why* the two systems differ

**Out — do not build these in v1:**

- Chinese and Thai systems. They are built on lunar calendars and
  pillar systems, not on planetary longitude. They are a separate
  engine and they are a later phase.
- Chart wheels. No SVG zodiac wheels, no aspect lines. The
  comparison table is the product; a wheel is a day of drawing that
  adds nothing to the idea.
- Interpretive text generation. The tool does not tell anyone what
  their chart means. It shows placements and where traditions
  disagree about them.
- Accounts, saving, sharing, any backend of any kind.

## Architecture

**Fully client-side. No backend. No API keys. No network calls after
page load.**

Ephemeris runs in the browser via a bundled library. Birth data is
entered, computed and displayed locally and is never transmitted
anywhere. This is a hard requirement, not a preference — it is the
reason this tool is trustworthy in a category full of data
harvesting, and it should be stated plainly in the interface.

Deploy target: Cloudflare Pages, static build.

Place input: a bundled offline city list with coordinates, or manual
latitude/longitude entry. **No geocoding API** — that would break the
no-network rule.

Timezone: historical timezone offsets matter and are a common source
of wrong charts. Handle the birth timezone explicitly rather than
assuming the viewer's current one. If a birth time is unknown, say
so in the interface and disable house-dependent rows rather than
silently defaulting to noon.

## Framing — non-negotiable

This tool is interpretive. It is not evidence-based and must never
present itself as such.

The interface says "these traditions disagree here." It never says
"this is what you are." No predictions, no personality claims, no
advice. Describe systems, not people.

A short honest note on what astrology is and is not belongs
somewhere visible. Not a buried disclaimer — a plainly written
statement that respects the reader.

## The bar

Someone who already knows astrology should find the divergence
column tells them something they hadn't laid out that explicitly
before.

Someone who knows nothing should come away understanding that these
are *systems* with *assumptions*, not a single truth with one
correct answer.

If it reads as one more birth chart generator, it hasn't worked.
