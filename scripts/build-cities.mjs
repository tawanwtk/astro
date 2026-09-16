/**
 * Generates the bundled offline place list.
 *
 * Run with `npm run build:cities`. The output is committed, so the app has no
 * runtime dependency on this script or on the `city-timezones` package -- and,
 * more to the point, no dependency on a geocoding API. Looking a place up must
 * never touch the network.
 *
 * Source: city-timezones (MIT), which is itself derived from the
 * SimpleMaps world cities database.
 */
import { writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { cityMapping } = require('city-timezones')

const OUTPUT = new URL('../src/data/places.json', import.meta.url)

// Four decimal places is about eleven metres, which is four orders of
// magnitude finer than anything that could move an Ascendant.
const round = (value) => Math.round(value * 1e4) / 1e4

const zones = []
const countries = []
const indexIn = (list, value) => {
  const existing = list.indexOf(value)
  if (existing !== -1) return existing
  return list.push(value) - 1
}

const seen = new Set()
const cities = []

for (const entry of cityMapping) {
  if (!entry.timezone || !entry.city_ascii) continue

  // Deduplicate same-name places within one country and zone, keeping the
  // largest, so the list does not offer six identical-looking options.
  const key = `${entry.city_ascii}|${entry.iso2}|${entry.province ?? ''}`
  if (seen.has(key)) continue
  seen.add(key)

  cities.push([
    entry.city_ascii,
    indexIn(countries, entry.country),
    indexIn(zones, entry.timezone),
    round(entry.lat),
    round(entry.lng),
    entry.pop ? Math.round(entry.pop) : 0,
  ])
}

// Largest first, so a plain prefix search surfaces the obvious answer.
cities.sort((a, b) => b[5] - a[5])

const payload = { zones, countries, cities }
const json = JSON.stringify(payload)
writeFileSync(OUTPUT, json)

console.log(`${cities.length} places, ${zones.length} zones, ${countries.length} countries`)
console.log(`${(json.length / 1024).toFixed(0)} kB raw, `
  + `${(gzipSync(json).length / 1024).toFixed(0)} kB gzipped`)
