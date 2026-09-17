/**
 * Seven — the colophon.
 *
 * Composition: the end matter. Small type, narrow measure, quiet. After six
 * sections of argument this one only accounts for itself.
 *
 * The network paragraph is the one that matters and it has been rewritten. It
 * used to say nothing left the device, which was true and is no longer. Saying
 * it anyway would have made this the one dishonest paragraph in a tool whose
 * entire premise is not being dishonest, so it now states the exact line: what
 * goes out, what it can carry, and what enforces the boundary.
 */
import { FRAME_EXPLANATIONS } from '../engine/divergence'

export function Colophon() {
  return (
    <footer className="section colophon">
      <div className="shell">
        <hr className="rule" />
        <span className="plate-number">Seven — colophon</span>
        <h2>What this is</h2>

        <p>
          A comparison of systems of astrology, shown through one set of birth
          data. It reports where the systems agree and where they do not,
          explains the mechanism behind each, and sets each tradition&rsquo;s
          own interpretive vocabulary beside the other&rsquo;s.
        </p>

        <p>{FRAME_EXPLANATIONS.interpretive}</p>

        <h3 className="colophon-sub">What leaves the browser</h3>

        <p>
          <strong>Birth data does not.</strong> The date, the time and the
          coordinates are used only to compute the chart, which happens in your
          browser by way of a bundled copy of the Swiss Ephemeris. Nothing is
          transmitted, logged or stored. The city list is bundled too, so
          searching a place and resolving its time zone both happen in memory.
        </p>

        <p>
          <strong>Map tiles do.</strong> The location picker draws an
          OpenStreetMap map, and each tile is an image fetched from OSM&rsquo;s
          servers. Those requests tell OSM which square of the world is on
          screen — which, once you have placed a pin, is a rough indication of
          where. The page sends no referrer with them, and nothing you type is
          ever part of a request. If you would rather not fetch tiles at all,
          the coordinate entry under the map is a complete path to a chart and
          uses no network.
        </p>

        <p>
          The boundary is enforced rather than promised. The content security
          policy this site is served under admits the OSM tile hosts to{' '}
          <code>img-src</code> and nothing else; <code>connect-src</code>{' '}
          remains <code>&lsquo;self&rsquo;</code>, so fetch, XHR, WebSocket and
          sendBeacon to any third party are blocked by the browser itself. There
          is no channel open that birth data could travel down, whatever the
          code might one day say. There is no backend, no analytics and no
          storage.
        </p>

        <p className="fineprint">
          Positions from the Swiss Ephemeris, computed once in the tropical
          frame and read through each system&rsquo;s own zodiac and house rule.
          Verified against published reference charts to under one arcminute.
          Interpretive material is assembled by lookup from each
          tradition&rsquo;s recorded doctrine and is not generated prose. Map
          data &copy; OpenStreetMap contributors, under the Open Database
          License.
        </p>
      </div>
    </footer>
  )
}
