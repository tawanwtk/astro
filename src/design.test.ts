/**
 * Design constraints from DESIGN_BRIEF.md, asserted against the stylesheet.
 *
 * These are easy to satisfy once and then break silently six commits later, so
 * they are tested rather than trusted:
 *
 *   - no parallax under `prefers-reduced-motion: reduce`
 *   - transforms and opacity only; layout properties are never animated
 *   - no scroll hijacking, no WebGL
 *   - fonts self-hosted, never fetched at runtime
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/index.css', 'utf8')

/** Extract the body of every `@keyframes` block. */
function keyframeBodies(source: string): { name: string; body: string }[] {
  const blocks: { name: string; body: string }[] = []
  const pattern = /@keyframes\s+([\w-]+)\s*\{/g

  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    let depth = 1
    let index = pattern.lastIndex
    while (depth > 0 && index < source.length) {
      if (source[index] === '{') depth++
      if (source[index] === '}') depth--
      index++
    }
    blocks.push({ name: match[1], body: source.slice(pattern.lastIndex, index - 1) })
  }

  return blocks
}

describe('reduced motion', () => {
  it('declares every scroll-driven animation inside a no-preference query', () => {
    // Every `animation-timeline` must sit within the reduced-motion gate. If
    // one is ever added outside it, the page animates for a reader who asked
    // it not to.
    const gateStart = css.indexOf('@media (prefers-reduced-motion: no-preference)')
    expect(gateStart, 'the reduced-motion gate is missing entirely').toBeGreaterThan(-1)

    // Find the extent of the gate block.
    let depth = 0
    let index = css.indexOf('{', gateStart)
    const blockStart = index
    do {
      if (css[index] === '{') depth++
      if (css[index] === '}') depth--
      index++
    } while (depth > 0 && index < css.length)
    const gate = css.slice(blockStart, index)

    const allTimelines = css.match(/animation-timeline/g) ?? []
    const gatedTimelines = gate.match(/animation-timeline/g) ?? []

    expect(allTimelines.length).toBeGreaterThan(0)
    expect(
      gatedTimelines.length,
      `${allTimelines.length} animation-timeline declarations exist but only `
      + `${gatedTimelines.length} are inside the reduced-motion gate.`,
    ).toBe(allTimelines.length)
  })

  it('turns off smooth scrolling under reduced motion', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?scroll-behavior:\s*auto/,
    )
  })
})

describe('animation properties', () => {
  /**
   * Animating a layout property forces layout on every frame. The brief rules
   * it out, and the rule is worth enforcing because the offending property is
   * usually added without thinking about it.
   */
  const LAYOUT_PROPERTIES = [
    'width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding',
    'inset', 'font-size', 'border-width', 'flex', 'grid-template',
  ]

  it.each(keyframeBodies(css))('@keyframes $name animates only transform and opacity', ({ body }) => {
    const declared = [...body.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1])

    for (const property of declared) {
      expect(
        ['transform', 'opacity'],
        `animates "${property}", which is neither transform nor opacity`,
      ).toContain(property)
    }

    for (const layoutProperty of LAYOUT_PROPERTIES) {
      expect(declared, `animates the layout property "${layoutProperty}"`)
        .not.toContain(layoutProperty)
    }
  })
})

describe('offline and honest', () => {
  it('self-hosts its font rather than fetching one at runtime', () => {
    expect(css).toMatch(/@font-face/)
    // A font CDN would be a network call after page load.
    expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit/)
  })

  it('uses no remote url() anywhere in the stylesheet', () => {
    const remote = [...css.matchAll(/url\(\s*['"]?(https?:)?\/\//g)]
    expect(remote.map((match) => match[0])).toEqual([])
  })
})

describe('contrast on the paper ground', () => {
  /*
   * DESIGN_BRIEF.md says contrast on the paper ground must be checked, not
   * assumed. It is worth checking here rather than leaning on Lighthouse:
   * Lighthouse scored accessibility 100 while the muted label colour was
   * sitting at 3.66:1 on 11px text.
   */
  function token(name: string): [number, number, number] {
    const match = css.match(new RegExp(`--color-${name}:\\s*#([0-9a-f]{6})`, 'i'))
    if (!match) throw new Error(`token --color-${name} not found`)
    const hex = match[1]
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
  }

  function relativeLuminance([r, g, b]: [number, number, number]): number {
    const channel = (value: number) => {
      const c = value / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }

  function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
    const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
    return (high + 0.05) / (low + 0.05)
  }

  const paper = () => token('paper')

  it.each([
    // Every one of these is used somewhere at normal text size, including the
    // 11-13px uppercase labels, so all must clear 4.5:1 rather than 3:1.
    ['ink', 4.5],
    ['ink-soft', 4.5],
    ['ink-faint', 4.5],
    ['mark', 4.5],
  ])('--color-%s clears AA for normal text on paper', (name, minimum) => {
    const ratio = contrastRatio(token(name), paper())
    expect(
      ratio,
      `--color-${name} is ${ratio.toFixed(2)}:1 on the paper ground, below ${minimum}:1`,
    ).toBeGreaterThanOrEqual(minimum)
  })

  it('keeps the button legible in reverse', () => {
    expect(contrastRatio(paper(), token('ink'))).toBeGreaterThanOrEqual(4.5)
  })
})

describe('the no-network promise is enforced, not just intended', () => {
  const headers = readFileSync('_headers', 'utf8')

  it('ships a CSP that blocks any request to a third party', () => {
    // The claim that birth data never leaves the browser should not rest on
    // the code continuing to contain no fetch call. `connect-src 'self'` makes
    // the browser enforce it: a request to anywhere else is blocked outright.
    expect(headers).toMatch(/connect-src 'self'/)
    expect(headers).toMatch(/default-src 'self'/)
    expect(headers).toMatch(/font-src 'self'/)
    // The form has no action and never navigates; blocking it means a
    // JavaScript failure cannot turn it into a plain GET with the birth data
    // in the query string.
    expect(headers).toMatch(/form-action 'none'/)
    // WebAssembly compilation needs this and nothing weaker.
    expect(headers).toMatch(/script-src 'self' 'wasm-unsafe-eval'/)
  })

  it('sends no referrer', () => {
    expect(headers).toMatch(/Referrer-Policy: no-referrer/)
  })
})

describe('no scroll hijacking', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const layers = readFileSync('src/components/Layers.tsx', 'utf8')

  it('never attaches a scroll or wheel listener', () => {
    for (const [name, source] of [['App', app], ['Layers', layers]] as const) {
      expect(source, `${name} listens to scroll`).not.toMatch(/addEventListener\(\s*['"]scroll/)
      expect(source, `${name} listens to wheel`).not.toMatch(/addEventListener\(\s*['"](wheel|touchmove)/)
      expect(source, `${name} calls preventDefault on scroll`).not.toMatch(/onWheel|onScroll/)
    }
  })

  it('uses no WebGL or Three.js', () => {
    const everything = css + app + layers
    // Matched against imports and API calls, not prose -- the word "three"
    // appears legitimately in comments describing the three layers.
    expect(everything).not.toMatch(/from\s+['"]three|require\(\s*['"]three|\bTHREE\./)
    expect(everything).not.toMatch(/getContext\(\s*['"]webgl/i)
  })
})
