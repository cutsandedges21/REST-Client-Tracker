import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { db } from '../store/db'

type AccountPageProps = {
  username: string | null
  onSignOut: () => void
  onBack: () => void
}

export function AccountPage({ username, onSignOut, onBack }: AccountPageProps) {
  const handleResetAllData = async () => {
    if (!confirm('Are you sure you want to reset all data? This will delete all clients, appointments, and completed jobs. This action cannot be undone.')) {
      return
    }

    try {
      // Delete all IndexedDB data
      await db.clients.clear()
      await db.appointments.clear()
      await db.completedJobs.clear()

      // Clear localStorage
      localStorage.clear()

      // Reload the page
      window.location.reload()
    } catch (error) {
      console.error('Failed to reset data:', error)
      alert('Failed to reset data. Please try again.')
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
            <h3
              className="text-base font-semibold tracking-tight text-slate-900"
            >
              Danger Zone
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Reset all your data including clients, appointments, and completed jobs.
            </p>
            <button
              type="button"
              onClick={handleResetAllData}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </GlowCard>
    </SettingsPage>
  )
}
