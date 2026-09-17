/**
 * Choosing a birth place: search the bundled list, drop a pin, or type
 * coordinates.
 *
 * This is the one place in the project that touches the network after load,
 * and the shape of the compromise is deliberate:
 *
 *   - Map *tiles* are fetched from OpenStreetMap. A tile request tells OSM
 *     which square of the world is on screen, which is a real disclosure and
 *     is stated plainly in the colophon rather than buried.
 *   - Nothing else leaves. Search runs against the bundled city list in
 *     memory, so a typed place name is never transmitted. The time zone for a
 *     dropped pin is resolved against that same list. There is no geocoding
 *     request and no reverse-geocoding request.
 *   - The CSP in `_headers` enforces the split: `img-src` admits the tile
 *     hosts and nothing else, while `connect-src` stays `'self'`, so a fetch
 *     or XHR to any third party is still blocked by the browser. Tiles are
 *     images; birth data would have to travel by a channel that is shut.
 *
 * Manual entry stays as a first-class fallback, not a grudging one. It is the
 * only option that works with the map blocked, offline, or refused -- and a
 * reader who would rather not pull tiles at all should be able to finish.
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'

import {
  type NearestPlace, type Place,
  formatCoordinates, loadPlaces, nearestPlace, searchPlaces,
} from '../data/places'

/** Where the coordinates came from, so the page can say so. */
export type LocationSource = 'city' | 'pin' | 'manual'

export interface LocationChoice {
  latitude: number
  longitudeEast: number
  /** IANA zone used to convert the birth time. */
  zone: string
  source: LocationSource
  /** Human label for the chosen point. */
  label: string
  /**
   * The listed place the zone was taken from, when it was not chosen directly.
   * Carries the distance, because borrowing a zone from 4 km away and from
   * 400 km away are different claims.
   */
  zoneFrom: NearestPlace | null
}

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors'

/** Somewhere unremarkable to open on, at a zoom that shows a continent. */
const INITIAL_VIEW: [number, number] = [20, 10]
const INITIAL_ZOOM = 2
const CHOSEN_ZOOM = 8

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function placeChoice(place: Place): LocationChoice {
  return {
    latitude: place.latitude,
    longitudeEast: place.longitudeEast,
    zone: place.zone,
    source: 'city',
    label: `${place.name}, ${place.country}`,
    zoneFrom: null,
  }
}

function pinChoice(
  latitude: number,
  longitudeEast: number,
  places: Place[],
  source: LocationSource,
): LocationChoice | null {
  const nearest = nearestPlace(places, latitude, longitudeEast)
  // Without the list there is no zone, and guessing UTC would silently shift
  // the chart by hours. Better to have the caller report that it failed.
  if (!nearest) return null

  return {
    latitude,
    longitudeEast,
    zone: nearest.place.zone,
    source,
    label: formatCoordinates(latitude, longitudeEast),
    zoneFrom: nearest,
  }
}

/**
 * The Leaflet map.
 *
 * Leaflet and its stylesheet are dynamically imported: together they are
 * around 150 kB that nothing needs until a reader opens the map, and loading
 * them eagerly would put a network fetch on the critical path of a page whose
 * first claim is that it does not make one.
 *
 * Scroll-wheel zoom is off, permanently. The brief rules out scroll hijacking,
 * and a map that swallows the page scroll when the pointer crosses it is
 * exactly that. Zoom is by the buttons, by double-click, or by pinch.
 */
function MapSurface({
  latitude, longitudeEast, onPick, describedBy,
}: {
  latitude: number | null
  longitudeEast: number | null
  onPick: (latitude: number, longitudeEast: number) => void
  describedBy: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const marker = useRef<Marker | null>(null)
  const [failed, setFailed] = useState(false)

  // The latest handler, so the click listener attached once below never calls
  // a stale closure. Written in an effect rather than during render: the map
  // is created in an effect too, so it cannot observe the ref before this has
  // run, and mutating a ref while rendering is the kind of thing that breaks
  // quietly under concurrent rendering.
  const pick = useRef(onPick)
  useEffect(() => {
    pick.current = onPick
  }, [onPick])

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const [leaflet] = await Promise.all([
          import('leaflet'),
          import('leaflet/dist/leaflet.css'),
        ])
        if (cancelled || !host.current || map.current) return

        const L = leaflet.default ?? leaflet
        const still = prefersReducedMotion()

        const instance = L.map(host.current, {
          center: INITIAL_VIEW,
          zoom: INITIAL_ZOOM,
          scrollWheelZoom: false,
          worldCopyJump: true,
          // A reader who asked for no motion gets none: Leaflet's zoom, pan
          // and fade transitions are animation like any other.
          zoomAnimation: !still,
          fadeAnimation: !still,
          markerZoomAnimation: !still,
        })

        L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: 18,
          // OSM's tile policy asks that a client not hammer the servers.
          crossOrigin: true,
        }).addTo(instance)

        instance.on('click', (event) => {
          pick.current(event.latlng.lat, event.latlng.lng)
        })

        map.current = instance
      } catch {
        // Tiles blocked, offline, or the import failed. Manual entry below is
        // a complete path to a chart, so this is a degraded map and not a
        // degraded tool.
        if (!cancelled) setFailed(true)
      }
    }

    void start()

    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
      marker.current = null
    }
  }, [])

  // Keep the marker on whatever the form currently holds, however it got
  // there -- a pin drop, a search result, or typed coordinates.
  useEffect(() => {
    const instance = map.current
    if (!instance || latitude === null || longitudeEast === null) return

    void import('leaflet').then((leaflet) => {
      const L = leaflet.default ?? leaflet
      if (!map.current) return

      if (!marker.current) {
        // A div icon rather than Leaflet's default PNG pin: it inherits the
        // page's ink, needs no image asset, and keeps the drafting register.
        marker.current = L.marker([latitude, longitudeEast], {
          keyboard: false,
          icon: L.divIcon({
            className: 'map-pin',
            html: '<span class="map-pin-mark" aria-hidden="true"></span>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        }).addTo(map.current)
      } else {
        marker.current.setLatLng([latitude, longitudeEast])
      }

      const zoom = Math.max(map.current.getZoom(), CHOSEN_ZOOM)
      map.current.setView([latitude, longitudeEast], zoom, { animate: false })
    })
  }, [latitude, longitudeEast])

  if (failed) {
    return (
      <p className="notice map-unavailable">
        The map could not be loaded — it may be blocked, or the connection may
        be down. Coordinates can be entered directly below, which needs no
        network at all.
      </p>
    )
  }

  return (
    <div
      ref={host}
      className="map-surface"
      role="application"
      aria-label="Map. Click to place a pin at the birth location."
      aria-describedby={describedBy}
    />
  )
}

export function LocationPicker({
  value, onChange, disabled,
}: {
  value: LocationChoice | null
  onChange: (choice: LocationChoice | null) => void
  disabled?: boolean
}) {
  const ids = useId()
  const [places, setPlaces] = useState<Place[]>([])
  const [placesFailed, setPlacesFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualLatitude, setManualLatitude] = useState('')
  const [manualLongitude, setManualLongitude] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)

  useEffect(() => {
    loadPlaces().then(setPlaces).catch(() => setPlacesFailed(true))
  }, [])

  const matches = value?.source === 'city' ? [] : searchPlaces(places, query)

  function choosePin(latitude: number, longitudeEast: number) {
    const choice = pinChoice(latitude, longitudeEast, places, 'pin')
    if (!choice) {
      setPlacesFailed(true)
      return
    }
    setQuery('')
    onChange(choice)
  }

  function applyManual() {
    const latitude = Number(manualLatitude)
    const longitudeEast = Number(manualLongitude)

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return setManualError('Latitude must be a number between −90 and 90.')
    }
    if (!Number.isFinite(longitudeEast) || longitudeEast < -180 || longitudeEast > 180) {
      return setManualError('Longitude must be a number between −180 and 180.')
    }

    const choice = pinChoice(latitude, longitudeEast, places, 'manual')
    if (!choice) {
      return setManualError(
        'The place list has not loaded, so the time zone for these coordinates '
        + 'cannot be resolved. Reload the page and try again.',
      )
    }

    setManualError(null)
    onChange(choice)
  }

  return (
    <div className="place-picker">
      <div className="field">
        <label className="label" htmlFor={`${ids}-search`}>Birth place</label>
        <div>
          <input
            id={`${ids}-search`}
            type="text"
            autoComplete="off"
            disabled={disabled}
            value={query}
            placeholder={places.length ? 'Search a city, or place a pin' : 'Loading places…'}
            onChange={(event) => {
              setQuery(event.target.value)
              if (value?.source === 'city') onChange(null)
            }}
          />
          {matches.length > 0 && (
            <ul className="suggestions">
              {matches.map((match) => (
                <li key={`${match.name}-${match.country}-${match.latitude}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(placeChoice(match))
                      setQuery(`${match.name}, ${match.country}`)
                    }}
                  >
                    {match.name}, {match.country}
                    <span className="meta">
                      {formatCoordinates(match.latitude, match.longitudeEast)} · {match.zone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p id={`${ids}-help`} className="map-help">
        Searching matches the city list bundled with this page — nothing typed
        here is sent anywhere. Clicking the map places a pin at that point. The
        map images themselves are fetched from OpenStreetMap.
      </p>

      <MapSurface
        latitude={value?.latitude ?? null}
        longitudeEast={value?.longitudeEast ?? null}
        onPick={choosePin}
        describedBy={`${ids}-help`}
      />

      <div className="place-readout" aria-live="polite">
        {value ? (
          <>
            <p className="chosen-line">
              <strong>{value.label}</strong>
              <span className="meta">
                {formatCoordinates(value.latitude, value.longitudeEast)} · {value.zone}
              </span>
            </p>
            {value.zoneFrom && (
              <p className="meta zone-provenance">
                Time zone taken from {value.zoneFrom.place.name},{' '}
                {value.zoneFrom.place.country} — the nearest place in the
                bundled list, {Math.round(value.zoneFrom.distanceKm)} km away.
                {value.zoneFrom.distanceKm > 150 && (
                  <> That is far enough that the zone may be wrong; if it is,
                  set the place by name instead.</>
                )}
              </p>
            )}
          </>
        ) : (
          <p className="meta">No place chosen yet.</p>
        )}
      </div>

      {placesFailed && (
        <p role="alert" className="notice error">
          The bundled place list could not be loaded, so neither search nor the
          time zone for a pin can be resolved. Reloading the page usually fixes
          it.
        </p>
      )}

      <details
        className="manual-entry"
        open={manualOpen}
        onToggle={(event) => setManualOpen(event.currentTarget.open)}
      >
        <summary>Enter coordinates directly</summary>
        <p className="measure">
          Decimal degrees, north and east positive. This path needs no map and
          no network — the time zone is still resolved against the bundled
          list.
        </p>
        <div className="manual-grid">
          <div className="field">
            <label className="label" htmlFor={`${ids}-lat`}>Latitude</label>
            <input
              id={`${ids}-lat`}
              type="text"
              inputMode="decimal"
              disabled={disabled}
              placeholder="13.7563"
              value={manualLatitude}
              onChange={(event) => setManualLatitude(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor={`${ids}-lon`}>Longitude</label>
            <input
              id={`${ids}-lon`}
              type="text"
              inputMode="decimal"
              disabled={disabled}
              placeholder="100.5018"
              value={manualLongitude}
              onChange={(event) => setManualLongitude(event.target.value)}
            />
          </div>
          <button type="button" className="action quiet" disabled={disabled} onClick={applyManual}>
            Use these coordinates
          </button>
        </div>
        {manualError && <p role="alert" className="notice error">{manualError}</p>}
      </details>
    </div>
  )
}
