import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { OneTimeTasks } from './components/OneTimeTasks'
import { AllTimeStats } from './components/AllTimeStats'
import { ProfitChart } from './components/ProfitChart'
import { CompleteJobDialog } from './components/CompleteJobDialog'
import { AnimatedBackground } from './components/AnimatedBackground'
import { RestMark } from './components/RestMark'
import { SettingsGear, type SettingsView } from './components/SettingsGear'
import { ThemePage } from './pages/ThemePage'
import { EmailPage } from './pages/EmailPage'
import { AccountPage } from './pages/AccountPage'
import { UpgradePage } from './pages/UpgradePage'
import { reminderScheduler } from './services/reminderScheduler'
import { getDashboardMetrics } from './lib/finance'
import { useTheme } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'
import { getPlan, isSpecialUser, type PlanId } from './lib/plans'
import type { Client } from './types/client'
import type { ClientSchema } from './lib/validation'
import { useClientStore } from './store/clientStore'

export function AuthedApp() {
  const navigate = useNavigate()
  const { theme, colorTheme, setTheme, setColorTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
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
    plan,
    setAuthBundle,
    addClient,
    updateClient,
    removeClient,
    restoreClient,
    addAppointment,
    updateAppointment,
    removeAppointment,
    setSearchTerm,
    setViewMode,
    completedJobs,
    addCompletedJob,
  } = useClientStore()

  const currentPlan = getPlan(plan)
  const atClientLimit =
    currentPlan.clientLimit !== null &&
    !isSpecialUser(username) &&
    clients.length >= currentPlan.clientLimit

  // Sync auth context -> store. Triggers initial data fetch.
  useEffect(() => {
    if (user && profile) {
      setAuthBundle({ userId: user.id, username: profile.username, plan: profile.plan })
    }
  }, [user, profile, setAuthBundle])

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

  const handleLogout = async () => {
    await signOut()
    setAuthBundle(null)
    setView('main')
    navigate('/', { replace: true })
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

  const handleUpgrade = (planId: PlanId) => {
    if (planId === plan) return
    toast.info('Stripe checkout coming soon')
  }

  return (
    <main className="relative min-h-screen px-3 py-6 text-slate-900 transition-colors sm:px-4 sm:py-8 md:px-8">
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
      ) : view === 'upgrade' ? (
        <UpgradePage
          currentPlan={plan}
          onUpgrade={handleUpgrade}
          onBack={() => setView('main')}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
          <header className="relative flex flex-col items-center gap-4 overflow-hidden px-4 py-8 sm:gap-6 sm:py-12 md:py-16">
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-[200px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[300px] sm:w-[500px]"
              style={{
                background:
                  'radial-gradient(ellipse, rgb(var(--color-primary-dark), 0.18) 0%, transparent 70%)',
              }}
            />

            <RestMark size="lg" animate />

            <span
              className="rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] sm:px-5 sm:text-[11px]"
              style={{
                color: 'rgb(var(--color-primary-dark))',
                border: '1px solid rgb(var(--color-primary-dark))',
              }}
            >
              Client Tracker
            </span>
          </header>

          <SearchHero
            value={searchTerm}
            onChange={setSearchTerm}
            totalClients={clients.length}
            visibleClients={filteredClients.length}
          />

          <AllTimeStats {...allTimeStats} />
          <ProfitChart completedJobs={completedJobs} />
          <DashboardStats {...metrics} />
          <OneTimeTasks
            onTasksChange={setOneTimeTasks}
            onExpensesChange={setExpenses}
            username={username}
          />
          <ClientForm
            onSubmit={addClient}
            onSchedule={async (clientId, date, time) => {
              const result = await addAppointment({ clientId, date, time })
              if (!result.ok) {
                toast.error((result as { ok: false; reason: string }).reason)
              }
            }}
            atLimit={atClientLimit}
            onUpgradeRequired={() => setView('upgrade')}
          />

          <GlowCard>
            <div className="p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  {filteredClients.length === clients.length
                    ? `${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`
                    : `${filteredClients.length} of ${clients.length}`}
                </p>
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

      {isLoaded && (
        <SettingsGear
          currentView={view}
          onNavigate={setView}
          plan={plan}
          username={username}
          accountName={profile?.account_name}
        />
      )}
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
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      }`}
      style={active ? { backgroundColor: `var(--color-primary)` } : {}}
    >
      {children}
    </button>
  )
}

function SearchHero({
  value,
  onChange,
  totalClients,
  visibleClients,
}: {
  value: string
  onChange: (v: string) => void
  totalClients: number
  visibleClients: number
}) {
  const trimmed = value.trim()
  const showStatus = trimmed.length > 0
  const noMatches = showStatus && visibleClients === 0
  const showHint = totalClients === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlowCard>
        <div className="p-4 sm:p-5 md:p-6">
          <label className="block">
            <span className="sr-only">Search clients</span>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                style={{ color: 'rgb(var(--color-primary))' }}
              />
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] sm:py-4 sm:text-lg"
                placeholder="Search by name, phone, email, or address..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
              {value && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <span aria-hidden className="text-xl leading-none">×</span>
                </button>
              )}
            </div>
          </label>

          <AnimatePresence initial={false}>
            {showStatus && (
              <motion.p
                key={noMatches ? 'no' : 'count'}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className={`mt-3 text-xs sm:text-sm ${noMatches ? 'text-rose-600' : 'text-slate-500'}`}
              >
                {noMatches
                  ? `No clients match "${trimmed}".`
                  : `Showing ${visibleClients} of ${totalClients} ${totalClients === 1 ? 'client' : 'clients'}.`}
              </motion.p>
            )}
            {!showStatus && showHint && (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-xs text-slate-500 sm:text-sm"
              >
                Add your first client below to start searching.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </GlowCard>
    </motion.div>
  )
}
