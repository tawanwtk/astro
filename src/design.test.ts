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
import { readdirSync, readFileSync } from 'node:fs'
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

  it('keeps the dark ground and the ink the same colour', () => {
    // They are separate tokens for a resolution reason, not a design one, so
    // they must not drift apart.
    expect(token('ground-dark')).toEqual(token('ink'))
  })

  /*
   * The convergence section inverts the ground, and an inverted section is
   * where contrast quietly goes wrong: the tokens that were checked against
   * paper are now sitting on ink and nobody rechecks them. So the ink ground
   * gets the same treatment the paper ground gets.
   */
  it.each([
    ['paper'],
    // Secondary ink for prose in the inverted section.
    ['paper-soft'],
    // The convergence accent, used for values and marks on the dark ground.
    ['meet-soft'],
  ])('--color-%s clears AA for normal text on the ink ground', (name) => {
    // Checked against --color-ground-dark, which is what actually paints that
    // section. --color-ink is redefined inside it and is not the background.
    const ratio = contrastRatio(token(name), token('ground-dark'))
    expect(
      ratio,
      `--color-${name} is ${ratio.toFixed(2)}:1 on the ink ground, below 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5)
  })
})

describe('the network promise is enforced, not just intended', () => {
  const headers = readFileSync('_headers', 'utf8')

  it('lets map tiles out and nothing else', () => {
    // The map made this claim narrower than it used to be, so the test has to
    // pin the new line exactly rather than assert the old absolute.
    //
    // Tiles are images, and only from OSM's tile hosts.
    expect(headers).toMatch(/img-src 'self' data: https:\/\/\*\.tile\.openstreetmap\.org/)
  })

  it('keeps every channel that could carry birth data closed', () => {
    // This is the load-bearing one. Tiles travel by img-src; birth data would
    // have to travel by fetch, XHR, WebSocket or sendBeacon, and all four are
    // governed by connect-src. Keeping it 'self' means the browser blocks
    // them outright, whatever the code happens to say.
    expect(headers).toMatch(/connect-src 'self'[;\s]/)
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
    // Also the tile requests: OSM learns which square of the map was drawn,
    // and not which page asked for it.
    expect(headers).toMatch(/Referrer-Policy: no-referrer/)
  })

  it('names no third party but the tile hosts', () => {
    const csp = headers.match(/Content-Security-Policy: (.+)/)![1]
    const hosts = [...csp.matchAll(/https:\/\/[^\s;]+/g)].map((match) => match[0])
    expect(hosts).toEqual(['https://*.tile.openstreetmap.org'])
  })
})

describe('no scroll hijacking', () => {
  /*
   * Every component, found rather than listed. The original version of this
   * test named App.tsx and Layers.tsx, which meant any new component was
   * exempt from the rule on the day it was written.
   */
  const sources = [
    ['App', 'src/App.tsx'] as [string, string],
    ...['src/components', 'src/sections'].flatMap((dir) =>
      readdirSync(dir)
        .filter((file) => file.endsWith('.tsx'))
        .map((file) => [file.replace(/\.tsx$/, ''), `${dir}/${file}`] as [string, string])),
  ].map(([name, path]) => [name, readFileSync(path, 'utf8')] as [string, string])

  it('covers more than a handful of files, so the sweep is doing something', () => {
    expect(sources.length).toBeGreaterThan(3)
  })

  it.each(sources)('%s never attaches a scroll or wheel listener', (name, source) => {
    expect(source, `${name} listens to scroll`).not.toMatch(/addEventListener\(\s*['"]scroll/)
    expect(source, `${name} listens to wheel`).not.toMatch(/addEventListener\(\s*['"](wheel|touchmove)/)
    expect(source, `${name} calls preventDefault on scroll`).not.toMatch(/onWheel|onScroll/)
  })

  it('never lets the map swallow the page scroll', () => {
    /*
     * Leaflet's default is scrollWheelZoom: true, which takes over the wheel
     * whenever the pointer is over the map. On a page that is one long descent
     * that is scroll hijacking by another name, so the option has to be
     * present and off wherever a map is constructed.
     */
    const maps = sources.filter(([, source]) => /L\.map\(/.test(source))
    expect(maps.length, 'no Leaflet map found to check').toBeGreaterThan(0)

    for (const [name, source] of maps) {
      expect(source, `${name} does not disable scrollWheelZoom`)
        .toMatch(/scrollWheelZoom:\s*false/)
    }
  })

  it('uses no WebGL or Three.js', () => {
    const everything = css + sources.map(([, source]) => source).join('')
    // Matched against imports and API calls, not prose -- the word "three"
    // appears legitimately in comments describing the three layers.
    expect(everything).not.toMatch(/from\s+['"]three|require\(\s*['"]three|\bTHREE\./)
    expect(everything).not.toMatch(/getContext\(\s*['"]webgl/i)
  })
})

describe('the map respects the motion preference', () => {
  const picker = readFileSync('src/components/LocationPicker.tsx', 'utf8')

  it('disables Leaflet animation under reduced motion', () => {
    // Leaflet animates zoom, pan and tile fade by default. The reduced-motion
    // rule in the brief is about the page, and the map is part of the page.
    expect(picker).toMatch(/prefers-reduced-motion: reduce/)
    for (const option of ['zoomAnimation', 'fadeAnimation', 'markerZoomAnimation']) {
      // Negated, i.e. `zoomAnimation: !still` -- the option is on only when
      // the reader has not asked for reduced motion.
      expect(picker, `${option} is not conditioned on the motion preference`)
        .toContain(`${option}: !`)
    }
  })
})
