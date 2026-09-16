/** Copies the Cloudflare Pages `_headers` file into the build output. */
import { copyFileSync } from 'node:fs'

copyFileSync(
  new URL('../_headers', import.meta.url),
  new URL('../dist/_headers', import.meta.url),
)
console.log('copied _headers')
