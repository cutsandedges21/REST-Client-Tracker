import { useState } from 'react'
import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { supabase } from '../lib/supabase'
import { updateProfileAccountName } from '../lib/api'
import { useClientStore } from '../store/clientStore'
import { useAuth } from '../contexts/AuthContext'

type AccountPageProps = {
  username: string | null
  onSignOut: () => void
  onBack: () => void
}

export function AccountPage({ username, onSignOut, onBack }: AccountPageProps) {
  const { user, profile, refreshProfile } = useAuth()
  const refresh = useClientStore((s) => s.refresh)
  const [resetting, setResetting] = useState(false)
  const [accountName, setAccountName] = useState(profile?.account_name ?? '')
  const [savingName, setSavingName] = useState(false)

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
      await supabase.from('clients').delete().eq('user_id', user.id)

      // Local per-device caches (one-time tasks, expenses, email/EmailJS config)
      // remain device-local. Wipe them too on full reset for parity.
      const u = username
      if (u) {
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
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Mossimo's Lawn Care"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />
              <button
                type="button"
                onClick={handleSaveAccountName}
                disabled={savingName}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
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
