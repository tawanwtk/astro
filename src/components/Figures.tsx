/**
 * Two diagrams that carry an argument the prose otherwise has to make twice.
 *
 * Both are inline SVG, drawn from the numbers actually computed for the chart
 * on screen rather than from a fixed illustration -- if the ayanamsa were
 * different, these would be different. Neither animates, and both are hidden
 * from assistive technology behind a text equivalent, because a diagram that
 * only works visually is a diagram that excludes readers.
 */

/** Point on a circle, degrees clockwise from twelve o'clock. */
function polar(radius: number, degrees: number): [number, number] {
  const radians = ((degrees - 90) * Math.PI) / 180
  return [radius * Math.cos(radians), radius * Math.sin(radians)]
}

/**
 * The two zodiac origins, drawn as offset rings.
 *
 * This is the whole disagreement in one picture: the same sky, two marks for
 * zero degrees Aries, set apart by the ayanamsa. The twelve divisions are
 * drawn on both rings so it is visible that every boundary is displaced, not
 * only the first.
 */
export function OffsetRings({ ayanamsa }: { ayanamsa: number }) {
  const rings = [
    { radius: 78, offset: 0, label: 'tropical', dashed: false },
    { radius: 58, offset: ayanamsa, label: 'sidereal', dashed: true },
  ]

  return (
    <figure className="figure figure-rings">
      <svg viewBox="-100 -100 200 200" role="img" aria-labelledby="rings-caption">
        <title id="rings-caption">
          Two rings, each divided into twelve signs. The inner sidereal ring is
          rotated {ayanamsa.toFixed(1)} degrees from the outer tropical ring, so
          every sign boundary falls in a different place.
        </title>

        {rings.map((ring) => (
          <g key={ring.label} stroke="var(--color-ink)" fill="none">
            <circle
              r={ring.radius}
              strokeWidth={0.8}
              opacity={0.45}
              strokeDasharray={ring.dashed ? '3 3' : undefined}
            />
            {Array.from({ length: 12 }, (_, index) => {
              const degrees = index * 30 - ring.offset
              const [x1, y1] = polar(ring.radius - 7, degrees)
              const [x2, y2] = polar(ring.radius + 7, degrees)
              const first = index === 0
              return (
                <line
                  key={index}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  strokeWidth={first ? 1.8 : 0.6}
                  opacity={first ? 1 : 0.4}
                  stroke={first ? 'var(--color-mark)' : 'var(--color-ink)'}
                />
              )
            })}
          </g>
        ))}

        {/* The gap itself, marked as an arc between the two zero points. */}
        <path
          d={`M ${polar(30, 0).join(' ')} A 30 30 0 0 0 ${polar(30, -ayanamsa).join(' ')}`}
          fill="none"
          stroke="var(--color-mark)"
          strokeWidth={1.2}
        />
      </svg>
      <figcaption>
        The two zero points, {ayanamsa.toFixed(2)}° apart. Outer ring tropical,
        inner ring sidereal. Every one of the twelve boundaries is displaced by
        the same amount.
      </figcaption>
    </figure>
  )
}

/**
 * The window in which the two systems agree about a sign.
 *
 * Drawn as one 30-degree sign with the agreeing band marked at its end. The
 * proportion is the argument: the band is small, which is why agreement on a
 * sign is the rare result rather than the expected one.
 */
export function AgreementWindow({ gap, window: windowWidth }: { gap: number; window: number }) {
  const width = 300
  const scale = width / 30
  const agreeStart = gap * scale

  return (
    <figure className="figure figure-window">
      <svg viewBox="0 0 300 62" role="img" aria-labelledby="window-caption">
        <title id="window-caption">
          One sign of thirty degrees. A placement in the first {gap.toFixed(1)}{' '}
          degrees is read as a different sign by the two systems; only a
          placement in the final {windowWidth.toFixed(1)} degrees is read as the
          same sign by both.
        </title>

        {/* The whole sign. */}
        <rect
          x={0} y={12} width={width} height={22}
          fill="none" stroke="var(--color-rule)" strokeWidth={1}
        />
        {/* The part where they part. */}
        <rect
          x={0} y={12} width={agreeStart} height={22}
          fill="var(--color-mark)" opacity={0.14}
        />
        {/* The part where they meet. */}
        <rect
          x={agreeStart} y={12} width={width - agreeStart} height={22}
          fill="var(--color-meet)" opacity={0.22}
        />
        <line
          x1={agreeStart} y1={6} x2={agreeStart} y2={40}
          stroke="var(--color-ink)" strokeWidth={1.2}
        />

        <text x={4} y={52} className="figure-label">0°</text>
        <text x={width - 4} y={52} className="figure-label" textAnchor="end">30°</text>
        <text x={agreeStart} y={52} className="figure-label" textAnchor="middle">
          {gap.toFixed(1)}°
        </text>
      </svg>
      <figcaption>
        One sign, thirty degrees wide. The systems agree about it only in the
        final {windowWidth.toFixed(1)}° — the shaded band on the right.
      </figcaption>
    </figure>
  )
}
