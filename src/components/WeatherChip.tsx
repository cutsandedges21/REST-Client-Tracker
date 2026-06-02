import { useEffect, useState } from 'react'
import {
  getBrowserLocation,
  getCurrentWeather,
  type CurrentWeather,
  type WeatherPlace,
  type WeatherPref,
} from '../lib/weather'

type WeatherChipProps = {
  pref: WeatherPref
  /** Called when we resolve a location via the browser so the parent can persist it. */
  onPlaceResolved: (place: WeatherPlace) => void
}

export function WeatherChip({ pref, onPlaceResolved }: WeatherChipProps) {
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [error, setError] = useState<string | null>(null)

  const placeKey = pref.place ? `${pref.place.lat},${pref.place.lon}` : 'none'

  useEffect(() => {
    if (!pref.enabled) return
    let cancelled = false

    const run = async () => {
      setError(null)
      try {
        let place = pref.place
        if (!place) {
          const coords = await getBrowserLocation()
          place = { ...coords, label: 'My location' }
          if (!cancelled) onPlaceResolved(place)
        }
        const result = await getCurrentWeather(place, pref.unit)
        if (!cancelled) setWeather(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Weather unavailable')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pref.enabled, pref.unit, placeKey])

  if (!pref.enabled) return null

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm"
      style={{
        borderColor: 'rgba(var(--color-primary), 0.35)',
        backgroundColor: 'rgba(var(--color-primary-light), 0.6)',
      }}
    >
      {weather ? (
        <>
          <span className="text-xl leading-none" aria-hidden>
            {weather.icon}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold tabular" style={{ color: 'rgb(var(--color-primary-dark))' }}>
              {weather.temp}°{weather.unit.toUpperCase()}
            </span>
            <span className="text-slate-600">{weather.label}</span>
            <span className="text-xs text-slate-500 tabular">
              H {weather.high}° · L {weather.low}°
            </span>
            {pref.place?.label && (
              <span className="text-xs text-slate-500">· {pref.place.label}</span>
            )}
          </div>
        </>
      ) : error ? (
        <span className="text-slate-500">
          {error} You can set a location under More → Account.
        </span>
      ) : (
        <span className="animate-pulse text-slate-500">Loading local weather…</span>
      )}
    </div>
  )
}
