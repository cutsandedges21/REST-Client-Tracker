import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, CreditCard, FileText, HelpCircle, LogOut, Palette, Search, User } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { ClientEditDialog } from './components/ClientEditDialog'
import { ClientForm } from './components/ClientForm'
import { ClientList } from './components/ClientList'
import { DashboardStats } from './components/DashboardStats'
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog'
import { EarningsChart } from './components/EarningsChart'
import { ExpensesCard } from './components/ExpensesCard'
import { GlowCard } from './components/GlowCard'
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { AllTimeStats } from './components/AllTimeStats'
import { ProfitChart } from './components/ProfitChart'
import { CompleteJobDialog, type CompleteJobInput } from './components/CompleteJobDialog'
import { InvoiceDialog } from './components/InvoiceDialog'
import { RoutePage } from './pages/RoutePage'
import { AnimatedBackground } from './components/AnimatedBackground'
import { RestMark } from './components/RestMark'
import { AppNav, type AppTab } from './components/AppNav'
import { OnboardingTour, type TourStep } from './components/OnboardingTour'
import { ThemePage } from './pages/ThemePage'
import { GuidePage } from './pages/GuidePage'
import { InvoiceTemplatePage } from './pages/InvoiceTemplatePage'
import { AccountPage } from './pages/AccountPage'
import { UpgradePage } from './pages/UpgradePage'
import { reminderScheduler, ReminderScheduler } from './services/reminderScheduler'
import { getDashboardMetrics } from './lib/finance'
import { startCheckout } from './lib/billing'
import { useTheme } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'
import { getPlan, isSpecialUser, type PlanId } from './lib/plans'
import type { Client } from './types/client'
import type { ClientSchema } from './lib/validation'
import { useClientStore } from './store/clientStore'

type SettingsView = 'main' | 'guide' | 'theme' | 'invoice' | 'account' | 'upgrade'

export function AuthedApp() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme, colorTheme, setTheme, setColorTheme } = useTheme()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [view, setView] = useState<SettingsView>('main')
  const [tab, setTab] = useState<AppTab>('home')
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [invoicingClient, setInvoicingClient] = useState<Client | null>(null)
  const [completeJobOpen, setCompleteJobOpen] = useState(false)
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined)
  const [showTour, setShowTour] = useState(false)

  const {
    clients,
    appointments,
    completedJobs,
    expenses,
    routeStops,
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
    addCompletedJob,
    addRouteStop,
    removeRouteStop,
    reorderRouteStops,
    completeRouteStop,
    reopenRouteStop,
    setJobPaid,
    saveAndClear,
  } = useClientStore()

  // One-time clients are tracked separately: excluded from the client count,
  // the main list and projections; shown in their own section instead.
  const recurringClients = useMemo(() => clients.filter((c) => c.serviceFrequency !== 'one_time'), [clients])
  const oneTimeClientsAll = useMemo(() => clients.filter((c) => c.serviceFrequency === 'one_time'), [clients])

  const currentPlan = getPlan(plan)
  const atClientLimit =
    currentPlan.clientLimit !== null && !isSpecialUser(username) && recurringClients.length >= currentPlan.clientLimit

  // Sync auth context -> store. Triggers initial data fetch (load-on-login).
  useEffect(() => {
    if (user && profile) {
      setAuthBundle({ userId: user.id, username: profile.username, plan: profile.plan })
    }
  }, [user, profile, setAuthBundle])

  // Start the reminder scheduler once data is ready; refresh its data on change.
  useEffect(() => {
    if (!isLoaded) return
    void ReminderScheduler.requestPermission()
    reminderScheduler.start(appointments, clients, (client, appt) => {
      toast(`Upcoming: ${client.fullName}`, { description: `at ${appt.time}${client.address ? ` · ${client.address}` : ''}` })
    })
    return () => reminderScheduler.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  useEffect(() => {
    if (isLoaded) reminderScheduler.updateData(appointments, clients)
  }, [appointments, clients, isLoaded])

  // Handle return from Stripe Checkout.
  useEffect(() => {
    const result = searchParams.get('checkout')
    if (!result) return
    if (result === 'success') {
      toast.success('Payment received — your plan is updating shortly.')
      void refreshProfile()
    } else if (result === 'cancel') {
      toast.info('Checkout canceled.')
    }
    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    setSearchParams(next, { replace: true })
  }, [searchParams, refreshProfile, setSearchParams])

  // First-time users get a one-off guided tour (per device, per account).
  useEffect(() => {
    if (!isLoaded || !username) return
    try {
      if (localStorage.getItem(`rest-tour-done-${username}`) === '1') return
    } catch {
      return
    }
    const t = setTimeout(() => setShowTour(true), 700)
    return () => clearTimeout(t)
  }, [isLoaded, username])

  const finishTour = () => {
    try {
      if (username) localStorage.setItem(`rest-tour-done-${username}`, '1')
    } catch {
      // ignore
    }
    setShowTour(false)
  }

  const tourSteps: TourStep[] = [
    {
      selector: null,
      title: 'Welcome to REST 👋',
      body: 'A quick 5-step tour of how everything works — about 30 seconds. You can skip anytime.',
    },
    {
      selector: 'home-stats',
      title: 'Your real numbers',
      body: 'Home shows all-time earnings, net profit, hourly rate, margin and markup — built from the jobs you log.',
      onEnter: () => setTab('home'),
    },
    {
      selector: 'clients-add',
      title: 'Add your clients',
      body: 'Add each customer with their rate, frequency and expenses, then invoice or log a finished job from their card.',
      onEnter: () => setTab('clients'),
    },
    {
      selector: 'schedule',
      title: 'Schedule visits',
      body: 'Book appointments on the calendar and get a reminder about 30 minutes before each one.',
      onEnter: () => setTab('schedule'),
    },
    {
      selector: 'guide-link',
      title: 'Help is always here',
      body: 'Whenever you’re unsure, open “How to use REST” for a full walkthrough of every feature.',
      onEnter: () => setTab('more'),
      cta: 'Open the guide',
      onCta: () => setView('guide'),
    },
  ]

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return recurringClients
    return recurringClients.filter((c) =>
      [c.fullName, c.phone, c.email, c.address].some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [recurringClients, searchTerm])

  const filteredOneTime = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return oneTimeClientsAll
    return oneTimeClientsAll.filter((c) =>
      [c.fullName, c.phone, c.email, c.address].some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [oneTimeClientsAll, searchTerm])

  const metrics = useMemo(() => getDashboardMetrics(filteredClients), [filteredClients])

  const onRemove = async () => {
    if (!pendingDelete) return
    const removed = await removeClient(pendingDelete.id)
    if (removed) {
      toast.success('Client removed', {
        action: { label: 'Undo', onClick: () => void restoreClient(removed) },
      })
    }
    setPendingDelete(null)
  }

  const handleSaveEdit = async (values: ClientSchema) => {
    if (!editingClient) return
    await updateClient(editingClient.id, values)
    toast.success('Client updated')
  }

  const handleLogout = async () => {
    saveAndClear()
    await signOut()
    setView('main')
    setTab('home')
    navigate('/login', { replace: true })
  }

  const handleCompleteJob = (client?: Client) => {
    setPreselectedClientId(client?.id)
    setCompleteJobOpen(true)
  }

  const handleSaveJob = async (job: CompleteJobInput) => {
    await addCompletedJob(job)
    toast.success(job.paid ? 'Job logged & paid' : 'Job logged — marked unpaid')
  }

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === plan) return
    if (planId === 'free') {
      toast.info('To cancel a paid plan, use the “Manage billing” link in your Stripe receipt email.')
      return
    }
    try {
      await startCheckout(planId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start checkout')
    }
  }

  const accountLabel = profile?.account_name?.trim() || (username ? `@${username}` : '')

  return (
    <main className="relative min-h-screen px-3 pb-28 pt-5 text-slate-900 transition-colors sm:px-4 md:px-8 md:pb-12">
      <AnimatedBackground />
      <Toaster richColors position="top-center" />

      {!isLoaded ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="animate-pulse text-sm text-slate-600">Loading your data…</p>
        </div>
      ) : view === 'guide' ? (
        <GuidePage
          onBack={() => setView('main')}
          onReplayTour={() => {
            setView('main')
            setTab('home')
            setShowTour(true)
          }}
        />
      ) : view === 'theme' ? (
        <ThemePage
          theme={theme}
          colorTheme={colorTheme}
          onThemeChange={setTheme}
          onColorThemeChange={setColorTheme}
          onBack={() => setView('main')}
        />
      ) : view === 'invoice' ? (
        <InvoiceTemplatePage onBack={() => setView('main')} />
      ) : view === 'account' ? (
        <AccountPage username={username} onSignOut={handleLogout} onBack={() => setView('main')} />
      ) : view === 'upgrade' ? (
        <UpgradePage currentPlan={plan} onUpgrade={handleUpgrade} onBack={() => setView('main')} />
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6">
          <header className="flex items-center justify-between gap-3 pt-1">
            <RestMark size="sm" />
            <AppNav variant="top" active={tab} onChange={setTab} />
            <PlanChip planName={currentPlan.name} accountLabel={accountLabel} />
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5 sm:gap-6"
            >
              {tab === 'home' && (
                <>
                  <div data-tour="home-stats">
                    <AllTimeStats completedJobs={completedJobs} expenses={expenses} />
                  </div>
                  <DashboardStats {...metrics} />
                  <ProfitChart completedJobs={completedJobs} />
                  <EarningsChart clients={recurringClients} />
                </>
              )}

              {tab === 'clients' && (
                <>
                  <SearchHero
                    value={searchTerm}
                    onChange={setSearchTerm}
                    totalClients={recurringClients.length}
                    visibleClients={filteredClients.length}
                  />

                  <GlowCard>
                    <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                        {filteredClients.length === recurringClients.length
                          ? `${recurringClients.length} ${recurringClients.length === 1 ? 'client' : 'clients'}`
                          : `${filteredClients.length} of ${recurringClients.length}`}
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
                  </GlowCard>

                  <ClientList
                    clients={filteredClients}
                    appointments={appointments}
                    viewMode={viewMode}
                    onRemove={setPendingDelete}
                    onEdit={setEditingClient}
                    onCompleteJob={handleCompleteJob}
                    onInvoice={setInvoicingClient}
                  />

                  {filteredOneTime.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-baseline gap-2 px-1">
                        <h2 className="font-display text-xl font-semibold" style={{ color: 'rgb(var(--color-primary-dark))' }}>
                          One-time clients
                        </h2>
                        <span className="text-xs font-medium text-slate-500">{oneTimeClientsAll.length}</span>
                      </div>
                      <ClientList
                        clients={filteredOneTime}
                        appointments={appointments}
                        viewMode="cards"
                        onRemove={setPendingDelete}
                        onEdit={setEditingClient}
                        onCompleteJob={handleCompleteJob}
                        onInvoice={setInvoicingClient}
                      />
                    </div>
                  )}

                  <div data-tour="clients-add">
                    <ClientForm
                      onSubmit={addClient}
                      onSchedule={async (clientId, date, time) => {
                        const result = await addAppointment({ clientId, date, time })
                        if (!result.ok) toast.error((result as { ok: false; reason: string }).reason)
                      }}
                      atLimit={atClientLimit}
                      onUpgradeRequired={() => setView('upgrade')}
                    />
                  </div>

                  <ExpensesCard />
                </>
              )}

              {tab === 'route' && (
                <RoutePage
                  clients={clients}
                  routeStops={routeStops}
                  completedJobs={completedJobs}
                  addRouteStop={addRouteStop}
                  removeRouteStop={removeRouteStop}
                  reorderRouteStops={reorderRouteStops}
                  completeRouteStop={completeRouteStop}
                  reopenRouteStop={reopenRouteStop}
                  setJobPaid={setJobPaid}
                />
              )}

              {tab === 'schedule' && (
                <div data-tour="schedule">
                  <ScheduleCalendar
                    clients={clients}
                    appointments={appointments}
                    onAdd={(input) => addAppointment(input)}
                    onUpdate={(id, input) => updateAppointment(id, input)}
                    onRemove={(id) => void removeAppointment(id)}
                  />
                </div>
              )}

              {tab === 'more' && (
                <MoreTab
                  planName={currentPlan.name}
                  accountLabel={accountLabel}
                  onNavigate={setView}
                  onSignOut={handleLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {view === 'main' && <AppNav variant="bottom" active={tab} onChange={setTab} />}

      {showTour && view === 'main' && <OnboardingTour steps={tourSteps} onFinish={finishTour} />}

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

      <InvoiceDialog
        open={Boolean(invoicingClient)}
        client={invoicingClient}
        onClose={() => setInvoicingClient(null)}
        onEditTemplate={() => {
          setInvoicingClient(null)
          setView('invoice')
        }}
      />

      <CompleteJobDialog
        open={completeJobOpen}
        onClose={() => setCompleteJobOpen(false)}
        onSave={handleSaveJob}
        clients={clients}
        preselectedClientId={preselectedClientId}
      />
    </main>
  )
}

function PlanChip({ planName, accountLabel }: { planName: string; accountLabel: string }) {
  return (
    <div className="flex flex-col items-end text-right">
      <span
        className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'rgb(var(--color-primary-dark))', border: '1px solid rgb(var(--color-primary-dark))' }}
      >
        {planName}
      </span>
      {accountLabel && <span className="mt-1 hidden text-xs text-slate-500 sm:block">{accountLabel}</span>}
    </div>
  )
}

function MoreTab({
  planName,
  accountLabel,
  onNavigate,
  onSignOut,
}: {
  planName: string
  accountLabel: string
  onNavigate: (view: SettingsView) => void
  onSignOut: () => void
}) {
  const items: { view: SettingsView; label: string; description: string; Icon: typeof Palette }[] = [
    { view: 'guide', label: 'How to use REST', description: 'Guide & feature walkthrough', Icon: HelpCircle },
    { view: 'theme', label: 'Theme', description: 'Light/dark & accent colour', Icon: Palette },
    { view: 'invoice', label: 'Invoices', description: 'Business name & default message', Icon: FileText },
    { view: 'account', label: 'Account', description: 'Profile & data', Icon: User },
    { view: 'upgrade', label: 'Plan', description: `Currently on ${planName}`, Icon: CreditCard },
  ]
  return (
    <div className="flex flex-col gap-4">
      <GlowCard>
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="font-display text-2xl font-semibold" style={{ color: 'rgb(var(--color-primary-dark))' }}>
              Settings
            </h2>
            <p className="mt-1 text-sm text-slate-600">{accountLabel || 'Manage your account'}</p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: 'rgb(var(--color-primary-dark))', border: '1px solid rgb(var(--color-primary-dark))' }}
          >
            {planName}
          </span>
        </div>
      </GlowCard>

      <GlowCard>
        <ul className="divide-y divide-slate-200/70 overflow-hidden rounded-[0.9375rem]">
          {items.map(({ view, label, description, Icon }) => (
            <li key={view}>
              <button
                type="button"
                data-tour={view === 'guide' ? 'guide-link' : undefined}
                onClick={() => onNavigate(view)}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: 'rgba(var(--color-primary-light), 0.9)', color: 'rgb(var(--color-primary-dark))' }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{label}</span>
                  <span className="block text-sm text-slate-500">{description}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      </GlowCard>

      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      }`}
      style={active ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
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
    <GlowCard>
      <div className="p-4 sm:p-5">
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
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-10 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              placeholder="Search clients…"
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
              {noMatches ? `No clients match "${trimmed}".` : `Showing ${visibleClients} of ${totalClients}.`}
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
              Add your first client below to start tracking.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </GlowCard>
  )
}
