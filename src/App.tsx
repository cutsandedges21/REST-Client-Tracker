import React, { type ReactNode, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { ClientEditDialog } from './components/ClientEditDialog'
import { ClientForm } from './components/ClientForm'
import { ClientList } from './components/ClientList'
import { DashboardStats } from './components/DashboardStats'
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog'
import { EarningsChart } from './components/EarningsChart'
import { GlowCard } from './components/GlowCard'
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { LoginScreen } from './components/LoginScreen'
import { OneTimeTasks } from './components/OneTimeTasks'
import { AllTimeStats } from './components/AllTimeStats'
import { ProfitChart } from './components/ProfitChart'
import { CompleteJobDialog } from './components/CompleteJobDialog'
import { AnimatedBackground } from './components/AnimatedBackground'
import { SettingsGear, type SettingsView } from './components/SettingsGear'
import { ThemePage } from './pages/ThemePage'
import { EmailPage } from './pages/EmailPage'
import { AccountPage } from './pages/AccountPage'
import { reminderScheduler } from './services/reminderScheduler'
import { emailService } from './services/emailService.js'
import { getDashboardMetrics } from './lib/finance'
import { colorThemes, type ColorTheme } from './lib/colorThemes'
import type { Client } from './types/client'
import type { ClientSchema } from './lib/validation'
import { useClientStore } from './store/clientStore'

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ERROR BOUNDARY] Caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ERROR BOUNDARY] Error details:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-red-800">Something went wrong</h2>
            <p className="mb-4 text-sm text-red-600">
              The application encountered an error. Please check the browser console for details.
            </p>
            <p className="mb-4 text-xs font-mono text-red-700">
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('purple')
  const [view, setView] = useState<SettingsView>('main')
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [oneTimeTasks, setOneTimeTasks] = useState<Array<{ amount: number; timeSpent: number }>>([])
  const [expenses, setExpenses] = useState<Array<{ amount: number }>>([])
  const [completeJobOpen, setCompleteJobOpen] = useState(false)
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined)

  const {
    clients,
    appointments,
    isLoaded,
    searchTerm,
    viewMode,
    username,
    initialize,
    addClient,
    updateClient,
    removeClient,
    restoreClient,
    addAppointment,
    updateAppointment,
    removeAppointment,
    setSearchTerm,
    setViewMode,
    setUsername,
    completedJobs,
    addCompletedJob,
  } = useClientStore()

  useEffect(() => {
    const init = async () => {
      try {
        await initialize()
      } catch (error) {
        console.error('[ERROR] App useEffect - initialize failed:', error)
      }
    }
    void init()
  }, [initialize, username])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const selectedTheme = colorThemes[colorTheme]
    document.documentElement.style.setProperty('--color-primary', selectedTheme.rgb.primary)
    document.documentElement.style.setProperty('--color-primary-light', selectedTheme.rgb.primaryLight)
    document.documentElement.style.setProperty('--color-primary-dark', selectedTheme.rgb.primaryDark)
  }, [colorTheme])

  useEffect(() => {
    if (isLoaded) {
      reminderScheduler.start(appointments, clients)
    }

    return () => {
      reminderScheduler.stop()
    }
  }, [isLoaded, appointments, clients])

  useEffect(() => {
    if (isLoaded) {
      reminderScheduler.updateData(appointments, clients)
    }
  }, [appointments, clients, isLoaded])

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((client) =>
      [client.fullName, client.phone, client.email, client.address].some((value) =>
        String(value).toLowerCase().includes(query),
      ),
    )
  }, [clients, searchTerm])

  const metrics = useMemo(() => getDashboardMetrics(filteredClients), [filteredClients])

  const getMonthlyEarnings = (client: Client) => {
    const frequencyMultipliers: Record<string, number> = {
      weekly: 4.33,
      biweekly: 2.17,
      three_weeks: 1.45,
      monthly: 1
    }
    return client.perCutRate * (frequencyMultipliers[client.serviceFrequency] || 1)
  }

  const getMonthlyTime = (client: Client) => {
    const frequencyMultipliers: Record<string, number> = {
      weekly: 4.33,
      biweekly: 2.17,
      three_weeks: 1.45,
      monthly: 1
    }
    return client.cutDurationMinutes * (frequencyMultipliers[client.serviceFrequency] || 1)
  }

  // Calculate all-time totals
  const allTimeStats = useMemo(() => {
    const regularEarnings = filteredClients.reduce((sum, client) => {
      const monthlyEarnings = getMonthlyEarnings(client)
      return sum + monthlyEarnings
    }, 0)

    const oneTimeEarnings = oneTimeTasks.reduce((sum, task) => sum + task.amount, 0)
    const totalEarnings = regularEarnings + oneTimeEarnings

    const regularTime = filteredClients.reduce((sum, client) => {
      const monthlyTime = getMonthlyTime(client)
      return sum + monthlyTime
    }, 0)

    const oneTimeTime = oneTimeTasks.reduce((sum, task) => sum + task.timeSpent, 0)
    const totalTime = regularTime + oneTimeTime

    // Calculate regular client expenses (expensePerClient × frequency)
    const regularExpenses = filteredClients.reduce((sum, client) => {
      const frequencyMultipliers: Record<string, number> = {
        weekly: 4.33,
        biweekly: 2.17,
        three_weeks: 1.45,
        monthly: 1
      }
      const monthlyExpense = client.expensePerClient * (frequencyMultipliers[client.serviceFrequency] || 1)
      return sum + monthlyExpense
    }, 0)

    const oneTimeExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalExpenses = regularExpenses + oneTimeExpenses

    return {
      totalEarnings,
      totalTime,
      totalExpenses
    }
  }, [filteredClients, oneTimeTasks, expenses])

  const onRemove = async () => {
    if (!pendingDelete) return
    const removed = await removeClient(pendingDelete.id)
    if (removed) {
      toast.success('Client Removed Successfully', {
        action: {
          label: 'Undo',
          onClick: () => void restoreClient(removed),
        },
      })
    }
    setPendingDelete(null)
  }

  const handleSaveEdit = async (values: ClientSchema) => {
    if (!editingClient) return
    await updateClient(editingClient.id, values)
    toast.success('Client Updated Successfully')
  }

  const handleLogin = (username: string) => {
    setUsername(username)
    emailService.setUsername(username)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('userAuth')
    setIsAuthenticated(false)
    setUsername(null)
    setView('main')
  }

  const handleCompleteJob = (client?: Client) => {
    setPreselectedClientId(client?.id)
    setCompleteJobOpen(true)
  }

  const handleSaveJob = async (job: {
    clientId: string
    clientName: string
    date: string
    earnings: number
    timeSpent: number
    expenses: number
    notes?: string
  }) => {
    await addCompletedJob(job)
    toast.success('Job Completed Successfully')
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <main className="relative min-h-screen px-4 py-8 text-slate-900 transition-colors md:px-8">
      <AnimatedBackground />
      <Toaster richColors position="top-right" />

      {!isLoaded ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600 text-sm animate-pulse">Loading your data...</p>
        </div>
      ) : view === 'theme' ? (
        <ThemePage
          theme={theme}
          colorTheme={colorTheme}
          onThemeChange={setTheme}
          onColorThemeChange={setColorTheme}
          onBack={() => setView('main')}
        />
      ) : view === 'email' ? (
        <EmailPage username={username} onBack={() => setView('main')} />
      ) : view === 'account' ? (
        <AccountPage username={username} onSignOut={handleLogout} onBack={() => setView('main')} />
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <header className="relative overflow-hidden flex flex-col items-center gap-8 py-14 md:py-20 -top-8 px-8"
          >

            {/* soft glow behind the letters */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgb(var(--color-primary-dark), 0.18) 0%, transparent 70%)" }} />

            <div className="flex items-end">
              {[
                { letter: "R", word: "Revenue" },
                { letter: "E", word: "Email" },
                { letter: "S", word: "Schedule" },
                { letter: "T", word: "Track" },
              ].map((item, i, arr) => (
                <div key={item.letter}
                  className="relative flex flex-col items-center gap-2.5 px-5 md:px-7"
                  style={i < arr.length - 1 ? {
                    borderRight: "1px solid rgb(var(--color-primary-dark))"
                  } : {}}>
                  <span className="text-7xl md:text-8xl font-extrabold leading-none tracking-tight"
                    style={{ color: `rgb(var(--color-primary-dark))`, textShadow: "0 0 40px rgb(var(--color-primary-dark), 0.35)" }}>
                    {item.letter}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: `rgb(var(--color-primary-dark))` }}>
                    {item.word}
                  </span>
                </div>
              ))}
            </div>

            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] rounded-full px-5 py-1.5"
              style={{
                color: "rgb(var(--color-primary-dark))",
                border: "1px solid rgb(var(--color-primary-dark))"
              }}>
              Client Tracker
            </span>
          </header>

          <AllTimeStats {...allTimeStats} />
          <ProfitChart completedJobs={completedJobs} />
          <DashboardStats {...metrics} />
          <OneTimeTasks onTasksChange={setOneTimeTasks} onExpensesChange={setExpenses} username={username} />
          <ClientForm onSubmit={addClient} onSchedule={async (clientId, date, time) => {
            const result = await addAppointment({ clientId, date, time })
            if (!result.ok) {
              toast.error((result as { ok: false; reason: string }).reason)
            }
          }} />

          <GlowCard>
            <div className="p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative block sm:max-w-sm sm:flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    placeholder="Search by name, phone, email, or address..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>
                <div className="inline-flex rounded-xl border border-slate-300 p-1">
                  <ToggleButton active={viewMode === 'cards'} onClick={() => setViewMode('cards')}>
                    Cards
                  </ToggleButton>
                  <ToggleButton active={viewMode === 'table'} onClick={() => setViewMode('table')}>
                    Table
                  </ToggleButton>
                </div>
              </div>
            </div>
          </GlowCard>

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <ClientList
                clients={filteredClients}
                appointments={appointments}
                viewMode={viewMode}
                onRemove={setPendingDelete}
                onEdit={setEditingClient}
                onCompleteJob={handleCompleteJob}
              />
            </motion.div>
          </AnimatePresence>

          <EarningsChart clients={filteredClients} />
          <ScheduleCalendar
            clients={filteredClients}
            appointments={appointments}
            onAdd={(input) => addAppointment(input)}
            onUpdate={(id, input) => updateAppointment(id, input)}
            onRemove={(id) => void removeAppointment(id)}
          />
        </div>
      )}

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        clientName={pendingDelete?.fullName}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void onRemove()}
      />

      <ClientEditDialog
        client={editingClient}
        open={Boolean(editingClient)}
        onClose={() => setEditingClient(null)}
        onSave={handleSaveEdit}
      />

      <CompleteJobDialog
        open={completeJobOpen}
        onClose={() => setCompleteJobOpen(false)}
        onSave={handleSaveJob}
        clients={clients}
        preselectedClientId={preselectedClientId}
      />

      {isLoaded && <SettingsGear currentView={view} onNavigate={setView} />}
    </main>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
        }`}
      style={active ? { backgroundColor: `var(--color-primary)` } : {}}
    >
      {children}
    </button>
  )
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
