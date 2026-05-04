import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Search, Sun } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { ClientEditDialog } from './components/ClientEditDialog'
import { ClientForm } from './components/ClientForm'
import { ClientList } from './components/ClientList'
import { DashboardStats } from './components/DashboardStats'
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog'
import { EarningsChart } from './components/EarningsChart'
import { GlowCard } from './components/GlowCard'
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { EmailSettings } from './components/EmailSettings'
import { EmailPreview } from './components/EmailPreview'
import { EmailAuth } from './components/EmailAuth'
import { OneTimeTasks } from './components/OneTimeTasks'
import { AllTimeStats } from './components/AllTimeStats'
import { ColorThemeSelector } from './components/ColorThemeSelector'
import { reminderScheduler } from './services/reminderScheduler'
import { getDashboardMetrics } from './lib/finance'
import { colorThemes, type ColorTheme } from './lib/colorThemes'
import type { Client } from './types/client'
import type { ClientSchema } from './lib/validation'
import { useClientStore } from './store/clientStore'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('purple')
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [oneTimeTasks, setOneTimeTasks] = useState<Array<{ amount: number; timeSpent: number }>>([])
  const [expenses] = useState<Array<{ amount: number }>>([])

  const {
    clients,
    appointments,
    isLoaded,
    searchTerm,
    viewMode,
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
  } = useClientStore()

  useEffect(() => {
    void initialize()
  }, [initialize])

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

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    return {
      totalEarnings,
      totalTime,
      totalExpenses
    }
  }, [filteredClients, oneTimeTasks, expenses])

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

  return (
    <main className="min-h-screen px-4 py-8 text-slate-900 transition-colors md:px-8" style={{ background: `linear-gradient(to bottom, var(--color-primary-light), white, white)` }}>
      <Toaster richColors position="top-right" />

      {!isLoaded ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600 text-sm animate-pulse">Loading your data...</p>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <GlowCard>
            <header className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center md:p-6">
              <div>
                <p className="text-sm font-medium" style={{ color: `var(--color-primary-dark)` }}>REST Client Tracker: Keep track of your business</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: `rgb(var(--color-primary-dark))` }}>
                  Revenue
                  <br></br>
                  Email
                  <br></br>
                  Schedule
                  <br></br>
                  Track
                </h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ColorThemeSelector currentTheme={colorTheme} onThemeChange={setColorTheme} />
                <button
                  type="button"
                  onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </div>
            </header>
          </GlowCard>

          <AllTimeStats {...allTimeStats} />
          <DashboardStats {...metrics} />
          <OneTimeTasks onTasksChange={setOneTimeTasks} />
          <EmailSettings />
          <EmailAuth />
          <EmailPreview clients={filteredClients} appointments={appointments} />
          <ClientForm onSubmit={addClient} />

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
                viewMode={viewMode}
                onRemove={setPendingDelete}
                onEdit={setEditingClient}
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

export default App
