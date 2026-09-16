/**
 * The Swiss Ephemeris payload must be reachable at the path the library asks
 * for at runtime.
 *
 * This is worth a test because getting it wrong does not fail the build. The
 * bundle compiles, the page renders, and the failure appears only when a real
 * reader submits a real chart on the deployed site.
 */
import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const REQUIRED = [
  // swisseph-wasm resolves `../wasm/<file>` against the bundled chunk in
  // /assets/, which is the site root's /wasm/. `public/` is copied verbatim
  // to the site root, so this is where the files have to be.
  { path: 'public/wasm/swisseph.wasm', minimumBytes: 400_000 },
  { path: 'public/wasm/swisseph.data', minimumBytes: 1_000_000 },
]

describe('bundled ephemeris payload', () => {
  it.each(REQUIRED)('$path is present and non-trivial', ({ path, minimumBytes }) => {
    expect(
      existsSync(path),
      `${path} is missing. Run \`npm run copy:wasm\`. Without it the deployed `
      + 'site renders fine and then fails the moment anyone computes a chart.',
    ).toBe(true)

    expect(statSync(path).size).toBeGreaterThan(minimumBytes)
  })

  it('the place list is bundled, so no geocoding API is ever needed', async () => {
    const places = await import('../data/places.json')
    const packed = (places.default ?? places) as unknown as {
      cities: unknown[]
      zones: string[]
    }
    expect(packed.cities.length).toBeGreaterThan(5000)
    expect(packed.zones).toContain('Asia/Bangkok')
  })
})
