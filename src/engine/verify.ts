/**
 * Prints the reference chart comparison as a table: actual versus expected,
 * in degrees, for every point.
 *
 * The tests assert these same values -- this exists so the comparison can be
 * read rather than merely passed. Run with `npm run verify`.
 */
import { computeChart, placementOf } from './chart'
import { BODIES, BODY_LABEL } from './ephemeris'
import { angularSeparation, formatLongitude, signOf } from './signs'
import {
  ARCMINUTE_TOLERANCE, ASCENDANT_TOLERANCE, AYANAMSA_REFERENCES, AYANAMSA_TOLERANCE,
  REFERENCE_CHARTS,
} from './reference-charts'

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length)
}

function row(
  label: string,
  expected: number,
  actual: number,
  tolerance: number,
): string {
  const delta = angularSeparation(actual, expected)
  const status = delta <= tolerance ? 'ok  ' : 'FAIL'
  return `  ${status} ${pad(label, 12)} `
    + `expected ${pad(formatLongitude(expected), 22)} `
    + `actual ${pad(formatLongitude(actual), 22)} `
    + `delta ${(delta * 60).toFixed(2).padStart(6)} arcmin`
}

async function main() {
  let failures = 0

  console.log('\nREFERENCE CHART VERIFICATION')
  console.log('Swiss Ephemeris, tropical frame, actual versus published.\n')

  for (const reference of REFERENCE_CHARTS) {
    const chart = await computeChart(reference.birth)

    console.log(`${reference.name}`)
    console.log(`  source: ${reference.source}`)
    console.log(`  tests:  ${reference.tests}`)
    console.log(
      `  time:   ${chart.utc.toISOString()} `
      + `(offset ${chart.offset.label}, source ${chart.offset.source})`,
    )
    console.log(
      `  JD ${chart.julianDay.toFixed(6)}   `
      + `Lahiri ayanamsa ${chart.systems.vedic.ayanamsa.toFixed(4)} deg`,
    )

    const utcOk = chart.utc.toISOString() === reference.expectedUtcIso
    if (!utcOk) {
      failures++
      console.log(`  FAIL UTC expected ${reference.expectedUtcIso}`)
    }

    const western = chart.systems.western
    const vedic = chart.systems.vedic
    const ascendant = western.ascendant!
    const expectedAsc = reference.tropical.ascendant!
    const ascExpected = signOf(ascendant.longitude) * 30 + expectedAsc.degreeInSign
    const ascLine = row('Ascendant', ascExpected, ascendant.longitude, ASCENDANT_TOLERANCE)
    if (ascLine.includes('FAIL')) failures++
    console.log(ascLine)

    for (const body of BODIES) {
      const placement = placementOf(western, body)!
      const expected = reference.tropical[body]
      const expectedLongitude = signOf(placement.longitude) * 30 + expected.degreeInSign
      const line = row(
        BODY_LABEL[body], expectedLongitude, placement.longitude, ARCMINUTE_TOLERANCE,
      )
      if (line.includes('FAIL')) failures++
      console.log(line)
    }

    console.log('\n  Derived sidereal frame (tropical minus ayanamsa, whole sign houses):')
    const siderealAsc = vedic.ascendant!
    console.log(
      `       ${pad('Ascendant', 12)} `
      + `${pad(ascendant.formatted, 22)} -> ${siderealAsc.formatted}`,
    )
    for (const body of BODIES) {
      const tropical = placementOf(western, body)!
      const sidereal = placementOf(vedic, body)!
      const signShift = tropical.signName !== sidereal.signName ? '  sign shift' : ''
      const houseShift = tropical.house !== sidereal.house
        ? `  house ${tropical.house} -> ${sidereal.house}`
        : ''
      console.log(
        `       ${pad(BODY_LABEL[body], 12)} `
        + `${pad(tropical.formatted, 22)} -> ${pad(sidereal.formatted, 22)}`
        + `${signShift}${houseShift}`,
      )
    }
    console.log('')
  }

  console.log('LAHIRI AYANAMSA, actual versus published tables\n')
  for (const { utcIso, expectedDegrees } of AYANAMSA_REFERENCES) {
    const date = new Date(utcIso)
    const chart = await computeChart({
      local: {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: 0,
        minute: 0,
      },
      timeKnown: true,
      latitude: 0,
      longitudeEast: 0,
      zone: 'UTC',
      manualOffsetMinutes: 0,
    })

    const delta = Math.abs(chart.systems.vedic.ayanamsa - expectedDegrees)
    const status = delta <= AYANAMSA_TOLERANCE ? 'ok  ' : 'FAIL'
    if (status === 'FAIL') failures++
    console.log(
      `  ${status} ${utcIso}  expected ${expectedDegrees.toFixed(5)} deg  `
      + `actual ${chart.systems.vedic.ayanamsa.toFixed(5)} deg  `
      + `delta ${(delta * 3600).toFixed(1)} arcsec`,
    )
  }

  console.log(
    failures === 0
      ? '\nAll reference values within tolerance.\n'
      : `\n${failures} value(s) outside tolerance.\n`,
  )

  process.exit(failures === 0 ? 0 : 1)
}

main()
