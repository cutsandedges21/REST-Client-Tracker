import { useState } from 'react'
import { CloudSun, LocateFixed } from 'lucide-react'
import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { Segmented } from '../components/Segmented'
import { supabase } from '../lib/supabase'
import { updateProfileAccountName, ACCOUNT_NAME_MAX } from '../lib/api'
import { inputClass, labelClass, primaryButtonClass, primaryButtonStyle, ghostButtonClass } from '../lib/ui'
import { cn } from '../lib/utils'
import {
  geocodeCity,
  getBrowserLocation,
  type TempUnit,
  type WeatherPref,
} from '../lib/weather'
import { useClientStore } from '../store/clientStore'
import { useAuth } from '../contexts/AuthContext'

type AccountPageProps = {
  username: string | null
  weatherPref: WeatherPref
  onWeatherPrefChange: (pref: WeatherPref) => void
  onSignOut: () => void
  onBack: () => void
}

export function AccountPage({
  username,
  weatherPref,
  onWeatherPrefChange,
  onSignOut,
  onBack,
}: AccountPageProps) {
  const { user, profile, refreshProfile } = useAuth()
  const refresh = useClientStore((s) => s.refresh)
  const [resetting, setResetting] = useState(false)
  const [accountName, setAccountName] = useState(profile?.account_name ?? '')
  const [savingName, setSavingName] = useState(false)

  const [cityInput, setCityInput] = useState('')
  const [locating, setLocating] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const handleSaveAccountName = async () => {
    if (!user) return
    setSavingName(true)
    try {
      const trimmed = accountName.trim()
      await updateProfileAccountName(user.id, trimmed || null)
      await refreshProfile()
      alert('Account name saved.')
    } catch {
      alert('Failed to save account name. Please try again.')
    } finally {
      setSavingName(false)
    }
  }

  const setUnit = (unit: TempUnit) => onWeatherPrefChange({ ...weatherPref, unit })

  const toggleWeather = (enabled: boolean) => {
    setWeatherError(null)
    onWeatherPrefChange({ ...weatherPref, enabled })
  }

  const useMyLocation = async () => {
    setLocating(true)
    setWeatherError(null)
    try {
      const coords = await getBrowserLocation()
      onWeatherPrefChange({
        ...weatherPref,
        enabled: true,
        place: { ...coords, label: 'My location' },
      })
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : 'Could not get your location.')
    } finally {
      setLocating(false)
    }
  }

  const setCity = async () => {
    const q = cityInput.trim()
    if (!q) return
    setLocating(true)
    setWeatherError(null)
    try {
      const place = await geocodeCity(q)
      if (!place) {
        setWeatherError(`Couldn't find "${q}". Try a nearby city.`)
        return
      }
      onWeatherPrefChange({ ...weatherPref, enabled: true, place })
      setCityInput('')
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : 'Could not look up that place.')
    } finally {
      setLocating(false)
    }
  }

  const handleResetAllData = async () => {
    if (!user) return
    if (
      !confirm(
        'Are you sure you want to reset all data? This will delete all clients, appointments, and completed jobs from your account. This action cannot be undone.',
      )
    ) {
      return
    }

    setResetting(true)
    try {
      // Order matters because of FK cascade safety; appointments + completed_jobs
      // both reference clients. Cascade-on-delete handles it, but doing it
      // explicitly avoids any race in the UI.
      await supabase.from('appointments').delete().eq('user_id', user.id)
      await supabase.from('completed_jobs').delete().eq('user_id', user.id)
      await supabase.from('expenses').delete().eq('user_id', user.id)
      await supabase.from('clients').delete().eq('user_id', user.id)

      // Clear the local snapshot cache + any legacy per-device keys.
      const u = username
      if (u) {
        localStorage.removeItem(`rest-cache-${u}`)
        localStorage.removeItem(`oneTimeTasks_${u}`)
        localStorage.removeItem(`expenses_${u}`)
        localStorage.removeItem(`userEmail_${u}`)
        localStorage.removeItem(`emailjsConfig_${u}`)
      }

      await refresh()
      alert('All data reset.')
    } catch (error) {
      console.error('Failed to reset data:', error)
      alert('Failed to reset data. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <SettingsPage title="Account" onBack={onBack}>
      <GlowCard>
        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div>
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: `rgb(var(--color-primary-dark))` }}
            >
              Signed in as
            </h2>
            <p className="mt-2 text-base font-medium text-slate-800">
              {username ?? 'Unknown user'}
            </p>
            {user?.email && (
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-5">
            <label
              htmlFor="account-name"
              className="text-base font-semibold tracking-tight text-slate-900"
            >
              Account Name
            </label>
            <p className="mt-1 text-sm text-slate-600">
              Shown in the corner badge instead of your user ID.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="account-name"
                type="text"
                maxLength={ACCOUNT_NAME_MAX}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Mossimo's Lawn Care"
                className={cn(inputClass, 'flex-1')}
              />
              <button
                type="button"
                onClick={handleSaveAccountName}
                disabled={savingName}
                className={cn(primaryButtonClass, 'sm:w-auto')}
                style={primaryButtonStyle}
              >
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5" style={{ color: 'rgb(var(--color-primary))' }} />
              <h3 className="text-base font-semibold tracking-tight text-slate-900">Local weather</h3>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Show today's conditions on your Home tab — handy for planning outdoor jobs.
            </p>

            <label className="mt-3 flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={weatherPref.enabled}
                onChange={(e) => toggleWeather(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
                style={{ accentColor: 'rgb(var(--color-primary))' }}
              />
              <span className={labelClass}>Show weather on Home</span>
            </label>

            {weatherPref.enabled && (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className={labelClass}>Units</span>
                  <Segmented<TempUnit>
                    ariaLabel="Temperature unit"
                    value={weatherPref.unit}
                    onChange={setUnit}
                    options={[
                      { value: 'c', label: '°C' },
                      { value: 'f', label: '°F' },
                    ]}
                  />
                </div>

                <div className="text-sm text-slate-600">
                  Location:{' '}
                  <span className="font-medium text-slate-800">
                    {weatherPref.place?.label ?? 'not set'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className={cn(ghostButtonClass, 'sm:w-auto')}
                  >
                    <LocateFixed className="h-4 w-4" style={{ color: 'rgb(var(--color-primary))' }} />
                    {locating ? 'Locating…' : 'Use my location'}
                  </button>
                  <div className="flex flex-1 gap-2">
                    <input
                      className={cn(inputClass, 'flex-1')}
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void setCity()
                      }}
                      placeholder="Or type a city…"
                    />
                    <button
                      type="button"
                      onClick={setCity}
                      disabled={locating || !cityInput.trim()}
                      className={cn(primaryButtonClass, 'shrink-0')}
                      style={primaryButtonStyle}
                    >
                      Set
                    </button>
                  </div>
                </div>

                {weatherError && <p className="text-sm font-medium text-rose-600">{weatherError}</p>}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-base font-semibold tracking-tight text-slate-900">
              Danger Zone
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Reset all your data including clients, appointments, and completed jobs.
            </p>
            <button
              type="button"
              onClick={handleResetAllData}
              disabled={resetting}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {resetting ? 'Resetting…' : 'Reset All Data'}
            </button>
          </div>
        </div>
      </GlowCard>
    </SettingsPage>
  )
}
