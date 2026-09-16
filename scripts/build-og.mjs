/**
 * Renders the Open Graph card to `public/og.png` at exactly 1200x630.
 *
 * Run with `npm run build:og`. The output is committed, so a deploy never
 * depends on this script or on a browser being installed.
 *
 * It drives the system Chrome through puppeteer-core rather than downloading
 * its own, and renders `scripts/og/og.html` -- the same paper, ink, accent and
 * typeface as the site, so the card is not a separate design that can drift.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

const executablePath = CANDIDATES.find((candidate) => existsSync(candidate))
if (!executablePath) {
  throw new Error(
    'No Chrome found. og.png is committed, so this only needs running when the '
    + 'card design changes.',
  )
}

const source = fileURLToPath(new URL('./og/og.html', import.meta.url))
const output = fileURLToPath(new URL('../public/og.png', import.meta.url))

const browser = await puppeteer.launch({ executablePath, headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
  await page.goto(`file://${source}`, { waitUntil: 'networkidle0' })
  await page.evaluateHandle('document.fonts.ready')
  await page.screenshot({ path: output, type: 'png' })
  console.log(`wrote ${output} at 1200x630`)
} finally {
  await browser.close()
}
