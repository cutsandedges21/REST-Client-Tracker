// Local weather via Open-Meteo — free, no API key, CORS-enabled (browser-direct).
// https://open-meteo.com/en/docs

export type TempUnit = 'c' | 'f'

export type WeatherPlace = {
  lat: number
  lon: number
  /** Friendly label, e.g. "Toronto" or "My location". */
  label: string
}

export type WeatherPref = {
  enabled: boolean
  unit: TempUnit
  place?: WeatherPlace
}

export type CurrentWeather = {
  temp: number
  high: number
  low: number
  code: number
  label: string
  icon: string
  unit: TempUnit
}

const DEFAULT_PREF: WeatherPref = { enabled: false, unit: 'c' }

const prefKey = (username: string) => `rest-weather-${username}`

export function readWeatherPref(username: string | null): WeatherPref {
  if (!username) return DEFAULT_PREF
  try {
    const raw = localStorage.getItem(prefKey(username))
    if (!raw) return DEFAULT_PREF
    const parsed = JSON.parse(raw) as Partial<WeatherPref>
    return {
      enabled: Boolean(parsed.enabled),
      unit: parsed.unit === 'f' ? 'f' : 'c',
      place: parsed.place,
    }
  } catch {
    return DEFAULT_PREF
  }
}

export function writeWeatherPref(username: string | null, pref: WeatherPref): void {
  if (!username) return
  try {
    localStorage.setItem(prefKey(username), JSON.stringify(pref))
  } catch {
    // ignore — weather is best-effort
  }
}

/** Map a WMO weather code to a short label + emoji icon. */
export function describeWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: '☀️' }
  if (code === 1) return { label: 'Mostly clear', icon: '🌤️' }
  if (code === 2) return { label: 'Partly cloudy', icon: '⛅' }
  if (code === 3) return { label: 'Overcast', icon: '☁️' }
  if (code === 45 || code === 48) return { label: 'Fog', icon: '🌫️' }
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: '🌦️' }
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: '🌧️' }
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: '🌨️' }
  if (code >= 80 && code <= 82) return { label: 'Rain showers', icon: '🌦️' }
  if (code === 85 || code === 86) return { label: 'Snow showers', icon: '🌨️' }
  if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' }
  return { label: 'Weather', icon: '🌡️' }
}

/** Ask the browser for the user's coordinates (one-shot). Rejects if denied/unavailable. */
export function getBrowserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location is not available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error('Location permission denied.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

/** Look up coordinates for a typed city name (fallback when location is denied). */
export async function geocodeCity(name: string): Promise<WeatherPlace | null> {
  const q = name.trim()
  if (!q) return null
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not look up that place.')
  const data = (await res.json()) as {
    results?: { latitude: number; longitude: number; name: string; admin1?: string }[]
  }
  const hit = data.results?.[0]
  if (!hit) return null
  return {
    lat: hit.latitude,
    lon: hit.longitude,
    label: hit.admin1 ? `${hit.name}, ${hit.admin1}` : hit.name,
  }
}

/** Fetch current conditions + today's high/low for a place. */
export async function getCurrentWeather(place: WeatherPlace, unit: TempUnit): Promise<CurrentWeather> {
  const tempUnit = unit === 'f' ? 'fahrenheit' : 'celsius'
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=${tempUnit}&timezone=auto&forecast_days=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load the weather right now.')
  const data = (await res.json()) as {
    current?: { temperature_2m: number; weather_code: number }
    daily?: { temperature_2m_max: number[]; temperature_2m_min: number[] }
  }
  const code = data.current?.weather_code ?? 0
  const { label, icon } = describeWeather(code)
  return {
    temp: Math.round(data.current?.temperature_2m ?? 0),
    high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 0),
    low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 0),
    code,
    label,
    icon,
    unit,
  }
}
