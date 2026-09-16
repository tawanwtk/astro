/**
 * The far and mid parallax layers.
 *
 * Texture, never content. Both are hidden from assistive technology, and
 * nothing here is required to read or use the page -- if the layers failed to
 * render at all, the document would be unchanged.
 *
 * The mid layer is the exception to "decoration": it draws the two zodiacs as
 * offset rings, so the idea of the tool is visible before a word is read.
 */

const SIGN_COUNT = 12

/** Point on a circle, degrees measured anticlockwise from the 3 o'clock mark. */
function polar(radius: number, degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180
  return [radius * Math.cos(radians), radius * Math.sin(radians)]
}

function DegreeTicks({ radius, every, length, width }: {
  radius: number
  every: number
  length: number
  width: number
}) {
  const ticks = []
  for (let degree = 0; degree < 360; degree += every) {
    const [x1, y1] = polar(radius, degree)
    const [x2, y2] = polar(radius + length, degree)
    ticks.push(
      <line key={degree} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={width} />,
    )
  }
  return <g stroke="currentColor">{ticks}</g>
}

/**
 * Far layer: concentric rings, degree graduations and an ecliptic arc, at the
 * scale of a plate border. Heavily faded, slowest moving.
 */
export function FarLayer() {
  return (
    <div className="layer layer-far" aria-hidden="true">
      <svg viewBox="-520 -520 1040 1040" fill="none" role="presentation">
        <g stroke="var(--color-ink)" opacity="0.5">
          <circle r="500" strokeWidth="1" />
          <circle r="430" strokeWidth="0.5" />
          <circle r="300" strokeWidth="0.5" />
          <circle r="180" strokeWidth="1" />
        </g>

        <g color="var(--color-ink)" opacity="0.45">
          <DegreeTicks radius={430} every={1} length={7} width={0.4} />
          <DegreeTicks radius={430} every={10} length={16} width={0.7} />
          <DegreeTicks radius={430} every={30} length={70} width={1} />
        </g>

        {/* The ecliptic, inclined to the equator by the obliquity. */}
        <g
          stroke="var(--color-ink)"
          opacity="0.4"
          transform="rotate(-23.44)"
        >
          <ellipse rx="500" ry="196" strokeWidth="0.75" />
        </g>
      </svg>
    </div>
  )
}

/**
 * Mid layer: the two reference frames, drawn as one ring of twelve divisions
 * and a second ring rotated by the ayanamsa.
 *
 * This is a diagram of the offset between two zodiacs, not a chart wheel: it
 * carries no placements and is the same for every reader.
 */
export function MidLayer({ ayanamsa = 24 }: { ayanamsa?: number }) {
  const divisions = (radius: number, inner: number) =>
    Array.from({ length: SIGN_COUNT }, (_, index) => {
      const degree = index * 30
      const [x1, y1] = polar(inner, degree)
      const [x2, y2] = polar(radius, degree)
      return <line key={degree} x1={x1} y1={y1} x2={x2} y2={y2} />
    })

  return (
    <div className="layer layer-mid" aria-hidden="true">
      <svg viewBox="-260 -260 520 520" fill="none" role="presentation">
        {/* Tropical frame: anchored to the equinox. */}
        <g stroke="var(--color-ink)" strokeWidth="1.1" opacity="0.7">
          <circle r="240" />
          <circle r="200" />
          {divisions(240, 200)}
          {/* Its zero point, marked longer. */}
          <line x1="200" y1="0" x2="262" y2="0" strokeWidth="2" />
        </g>

        {/* Sidereal frame: the same circle, started one ayanamsa earlier. */}
        <g
          stroke="var(--color-mark)"
          strokeWidth="1.1"
          opacity="0.85"
          transform={`rotate(${-ayanamsa})`}
        >
          <circle r="188" strokeDasharray="2.5 4" />
          <circle r="148" strokeDasharray="2.5 4" />
          {divisions(188, 148)}
          <line x1="148" y1="0" x2="210" y2="0" strokeWidth="2" strokeDasharray="0" />
        </g>

        {/*
         * The gap itself: the arc swept between the two zero points, with a
         * tick at each end. This is the ayanamsa, and it is the one thing in
         * the layer that is meant to be noticed.
         */}
        <g stroke="var(--color-mark)" opacity="0.95">
          <path
            d={`M ${polar(112, 0)[0]} ${polar(112, 0)[1]}
                A 112 112 0 0 0 ${polar(112, -ayanamsa)[0]} ${polar(112, -ayanamsa)[1]}`}
            strokeWidth="2.5"
          />
          <line x1={polar(104, 0)[0]} y1={polar(104, 0)[1]} x2={polar(120, 0)[0]} y2={polar(120, 0)[1]} strokeWidth="2" />
          <line
            x1={polar(104, -ayanamsa)[0]}
            y1={polar(104, -ayanamsa)[1]}
            x2={polar(120, -ayanamsa)[0]}
            y2={polar(120, -ayanamsa)[1]}
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}

export function Layers({ ayanamsa }: { ayanamsa?: number }) {
  return (
    <div className="layers" aria-hidden="true">
      <FarLayer />
      <MidLayer ayanamsa={ayanamsa} />
    </div>
  )
}
