/**
 * Copies the Swiss Ephemeris wasm payload into `public/wasm/`.
 *
 * swisseph-wasm locates its own .wasm and .data files with
 * `new URL('../wasm/' + path, import.meta.url)`. In dev that resolves inside
 * node_modules and Vite serves it. In a production build the module has been
 * bundled into `/assets/`, so `../wasm/` resolves to `/wasm/` at the site root
 * -- which only exists if we put it there.
 *
 * Getting this wrong does not fail the build. It fails at runtime, on the
 * deployed site, the first time someone submits a chart. Hence the script and
 * the test that asserts the files are present.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const packageRoot = dirname(require.resolve('swisseph-wasm/package.json'))
const source = join(packageRoot, 'wasm')
const destination = new URL('../public/wasm/', import.meta.url)

mkdirSync(destination, { recursive: true })

for (const file of ['swisseph.wasm', 'swisseph.data']) {
  const from = join(source, file)
  if (!existsSync(from)) {
    throw new Error(`Missing ${from}. The swisseph-wasm layout has changed.`)
  }
  copyFileSync(from, new URL(file, destination))
  console.log(`copied ${file}`)
}
