# TECHNICAL.md — calculation rules

The astronomy is the part that is easy to get subtly wrong and hard
to notice. Everything here is a correctness requirement, not a
suggestion.

## Ephemeris

Use a bundled, offline ephemeris. Preferred: a Swiss Ephemeris
WebAssembly build. Fallback: `astronomia`.

Evaluate both before committing and report the trade-off — bundle
size against accuracy and against how much house-system and
ayanamsa support comes for free. Swiss Ephemeris is the reference
standard and gives ayanamsa and house cusps directly; `astronomia`
is far lighter but more of the astrological layer has to be written
by hand.

Whichever is chosen, it must run fully offline.

## The single computation

Compute geocentric ecliptic longitude **once**, in the tropical
frame, for each body. Both traditions read from that same
computation. The difference between them is interpretive, and the
code should make that obvious:

- **Western tropical** — tropical longitude used directly.
- **Vedic sidereal** — tropical longitude minus the ayanamsa.

Use **Lahiri** ayanamsa for v1, since it is the standard in Indian
practice. The value is date-dependent, roughly 24 degrees in the
present era — do not hardcode a constant. Take it from the library
if available; compute it properly if not.

Do not compute positions twice. If the two systems ever disagree on
something that is not an ayanamsa or house-system difference, that
is a bug.

## Houses

- **Western** — Placidus. Requires accurate birth time and latitude.
  Placidus fails at extreme latitudes; handle that case explicitly
  rather than emitting nonsense.
- **Vedic** — whole sign. The ascendant's sign becomes the first
  house entirely; each subsequent sign is the next house. Simpler
  than Placidus and must not be confused with it.

House placement is where the two systems diverge most visibly, which
makes it the most valuable output and the one most worth verifying.

## Time — the main source of wrong charts

- Birth time is entered as **local time at the place of birth**.
- Convert to UTC using the historical offset **for that date at that
  location**, not the current offset. Thailand is stable at UTC+7,
  but many places are not, and DST rules have changed repeatedly.
- Thailand specifically: standard offset is UTC+7, no DST in the
  modern era. Note that Thai-language birth records frequently use
  the Buddhist Era calendar — BE minus 543 gives CE. If BE input is
  ever accepted, label it unmistakably.
- If birth time is unknown: the Ascendant and all house placements
  are undefined. **Disable those rows and say so.** Never silently
  default to noon and present the result as if it were real — that
  is the single most common dishonesty in chart tools.

## Verification — required before the visual layer

Validate against at least two published reference charts with known
correct values, ideally from different sources and different
latitudes, at least one in the southern hemisphere.

Check, in this order:

1. Tropical Sun longitude
2. Tropical Ascendant — most sensitive to time and latitude errors
3. Ayanamsa value for the date
4. Sidereal placements derived from the above
5. House placements in both systems

Report actual versus expected in degrees. An ascendant within a
degree is acceptable; a sign boundary error is not.

Write these as tests, not as a one-off script.

## Known traps

- Degrees versus radians. Every trigonometric bug in this domain is
  this.
- Longitude sign convention: east positive, west negative. Libraries
  disagree. Check, do not assume.
- Sign boundaries at 0 and 30 degrees. A position at 29.97 degrees
  is in the current sign, not the next one. Off-by-one here silently
  produces a wrong chart that looks plausible.
- Retrograde motion is a display property, not a position error.
- Julian Day conversion with a time component. Fractional days are
  where precision is lost.
