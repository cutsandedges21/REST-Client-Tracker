import { create } from 'zustand'
import type { Client, ClientFormInput, ScheduledSlot } from '../types/client'
import type { CompletedJob } from '../types/completedJob'
import type { Expense, ExpenseFormInput } from '../types/expense'
import type { PaymentMethod, RouteStop } from '../types/route'
import type { PlanId } from '../lib/plans'
import {
  deleteAppointment,
  deleteClient,
  deleteCompletedJob,
  deleteExpenseRow,
  deleteRouteStop,
  fetchAppointments,
  fetchClients,
  fetchCompletedJobs,
  fetchExpenses,
  fetchRouteStops,
  insertAppointment,
  insertClient,
  insertCompletedJob,
  insertExpense,
  insertRouteStop,
  reorderRouteStops,
  restoreClientRow,
  restoreExpenseRow,
  setRouteStopJob,
  updateAppointmentRow,
  updateClientRow,
  updateCompletedJobRow,
} from '../lib/api'

type ViewMode = 'cards' | 'table'

type AuthBundle = {
  userId: string
  username: string
  plan: PlanId
}

type Snapshot = {
  clients: Client[]
  appointments: ScheduledSlot[]
  completedJobs: CompletedJob[]
  expenses: Expense[]
  routeStops: RouteStop[]
}

interface ClientState {
  userId: string | null
  username: string | null
  plan: PlanId
  clients: Client[]
  appointments: ScheduledSlot[]
  completedJobs: CompletedJob[]
  expenses: Expense[]
  routeStops: RouteStop[]
  isLoaded: boolean
  searchTerm: string
  viewMode: ViewMode

  setAuthBundle: (bundle: AuthBundle | null) => void
  refresh: () => Promise<void>
  /** Explicit "save on logout": persist a local snapshot, then clear state. */
  saveAndClear: () => void

  addClient: (data: ClientFormInput) => Promise<string>
  updateClient: (id: string, data: ClientFormInput) => Promise<void>
  removeClient: (id: string) => Promise<Client | undefined>
  restoreClient: (client: Client) => Promise<void>

  addAppointment: (input: { clientId: string; date: string; time: string }) => Promise<{ ok: true } | { ok: false; reason: string }>
  updateAppointment: (
    id: string,
    input: { clientId: string; date: string; time: string },
  ) => Promise<{ ok: true } | { ok: false; reason: string }>
  removeAppointment: (id: string) => Promise<void>

  addCompletedJob: (job: Omit<CompletedJob, 'id' | 'username' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateCompletedJob: (id: string, job: Partial<CompletedJob>) => Promise<void>
  deleteCompletedJob: (id: string) => Promise<void>
  /** Mark a logged job paid/unpaid (with optional method). */
  setJobPaid: (id: string, paid: boolean, method?: PaymentMethod) => Promise<void>

  addRouteStop: (input: { clientId: string; date: string; time?: string }) => Promise<{ ok: true } | { ok: false; reason: string }>
  removeRouteStop: (id: string) => Promise<void>
  reorderRouteStops: (date: string, orderedIds: string[]) => Promise<void>
  /** Log a stop as done: creates a completed job and links it to the stop. */
  completeRouteStop: (
    stopId: string,
    job: Omit<CompletedJob, 'id' | 'username' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>
  /** Reopen a done stop: deletes its completed job and clears the link. */
  reopenRouteStop: (stopId: string) => Promise<void>

  addExpense: (input: ExpenseFormInput) => Promise<string>
  removeExpense: (id: string) => Promise<Expense | undefined>
  restoreExpense: (expense: Expense) => Promise<void>

  setSearchTerm: (term: string) => void
  setViewMode: (mode: ViewMode) => void
}

function slotConflict(
  appointments: ScheduledSlot[],
  date: string,
  time: string,
  excludeId?: string,
): boolean {
  return appointments.some((a) => a.date === date && a.time === time && a.id !== excludeId)
}

// ---------------- Local snapshot cache (offline resilience + instant login) ----------------

const cacheKey = (username: string) => `rest-cache-${username}`

function readSnapshot(username: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(cacheKey(username))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Snapshot>
    return {
      clients: parsed.clients ?? [],
      appointments: parsed.appointments ?? [],
      completedJobs: parsed.completedJobs ?? [],
      expenses: parsed.expenses ?? [],
      routeStops: parsed.routeStops ?? [],
    }
  } catch {
    return null
  }
}

function writeSnapshot(username: string | null, snapshot: Snapshot) {
  if (!username) return
  try {
    localStorage.setItem(cacheKey(username), JSON.stringify(snapshot))
  } catch {
    // storage full / unavailable — ignore, network remains source of truth
  }
}

export const useClientStore = create<ClientState>((set, get) => {
  /** Persist the current in-memory data for the signed-in user. */
  const persist = () => {
    const { username, clients, appointments, completedJobs, expenses, routeStops } = get()
    writeSnapshot(username, { clients, appointments, completedJobs, expenses, routeStops })
  }

  return {
    userId: null,
    username: null,
    plan: 'free',
    clients: [],
    appointments: [],
    completedJobs: [],
    expenses: [],
    routeStops: [],
    isLoaded: false,
    searchTerm: '',
    viewMode: 'cards',

    setAuthBundle: (bundle) => {
      if (!bundle) {
        set({
          userId: null,
          username: null,
          plan: 'free',
          clients: [],
          appointments: [],
          completedJobs: [],
          expenses: [],
          routeStops: [],
          isLoaded: false,
        })
        return
      }
      // Load-on-login: hydrate instantly from the last local snapshot (if any),
      // so the UI shows data immediately while the network refresh runs.
      const cached = readSnapshot(bundle.username)
      set({
        userId: bundle.userId,
        username: bundle.username,
        plan: bundle.plan,
        clients: cached?.clients ?? [],
        appointments: cached?.appointments ?? [],
        completedJobs: cached?.completedJobs ?? [],
        expenses: cached?.expenses ?? [],
        routeStops: cached?.routeStops ?? [],
        isLoaded: cached !== null,
      })
      void get().refresh()
    },

    refresh: async () => {
      const { userId, username } = get()
      if (!userId || !username) return
      try {
        // Core tables exist in every install. Fetch them together.
        const [clients, appointments, completedJobs] = await Promise.all([
          fetchClients(userId, username),
          fetchAppointments(userId, username),
          fetchCompletedJobs(userId, username),
        ])
        // Expenses and route stops are best-effort: their tables/columns may not
        // exist until the latest migration is applied — don't let that block the
        // rest of the app.
        let expenses = get().expenses
        try {
          expenses = await fetchExpenses(userId, username)
        } catch (expenseError) {
          console.warn('[store] expenses fetch failed (run the latest schema.sql?):', expenseError)
        }
        let routeStops = get().routeStops
        try {
          routeStops = await fetchRouteStops(userId, username)
        } catch (routeError) {
          console.warn('[store] route stops fetch failed (run the latest schema.sql?):', routeError)
        }
        set({ clients, appointments, completedJobs, expenses, routeStops, isLoaded: true })
        persist()
      } catch (error) {
        console.error('[store] refresh failed:', error)
        set({ isLoaded: true }) // unblock the UI; user sees cached/empty state
      }
    },

    saveAndClear: () => {
      // Delete the cache on logout so client PII doesn't sit in localStorage
      // on shared/public devices. The cache was already kept current during the
      // session via persist() after every mutation, so nothing is lost.
      const { username } = get()
      if (username) {
        try {
          localStorage.removeItem(cacheKey(username))
        } catch {
          // ignore — storage unavailable
        }
      }
      set({
        userId: null,
        username: null,
        plan: 'free',
        clients: [],
        appointments: [],
        completedJobs: [],
        expenses: [],
        routeStops: [],
        isLoaded: false,
        searchTerm: '',
      })
    },

    addClient: async (data) => {
      const { userId, username, plan, clients } = get()
      if (!userId || !username) throw new Error('Not signed in')

      // One-time clients don't count toward the free-plan limit and are never blocked.
      const recurringCount = clients.filter((c) => c.serviceFrequency !== 'one_time').length
      if (plan === 'free' && data.serviceFrequency !== 'one_time' && recurringCount >= 3) {
        throw new Error('Client limit reached. Upgrade to Pro for unlimited clients.')
      }

      const inserted = await insertClient(userId, username, data)
      set((state) => ({ clients: [inserted, ...state.clients] }))
      persist()
      return inserted.id
    },

    updateClient: async (id, data) => {
      const { username } = get()
      if (!username) return
      const updated = await updateClientRow(id, username, data)
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? updated : c)),
      }))
      persist()
    },

    removeClient: async (id) => {
      const target = get().clients.find((c) => c.id === id)
      if (!target) return undefined
      await deleteClient(id)
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        // appointments for this client cascade in DB; mirror locally
        appointments: state.appointments.filter((a) => a.clientId !== id),
      }))
      persist()
      return target
    },

    restoreClient: async (client) => {
      const { userId } = get()
      if (!userId) return
      await restoreClientRow(userId, client)
      set((state) => ({
        clients: [client, ...state.clients.filter((item) => item.id !== client.id)],
      }))
      persist()
    },

    addAppointment: async ({ clientId, date, time }) => {
      const { userId, username } = get()
      if (!userId || !username) throw new Error('Not signed in')
      if (slotConflict(get().appointments, date, time)) {
        return { ok: false, reason: 'That time is already booked on this day.' }
      }
      try {
        const slot = await insertAppointment(userId, username, { clientId, date, time })
        set((state) => ({
          appointments: [...state.appointments, slot].sort(
            (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
          ),
        }))
        persist()
        return { ok: true }
      } catch (error) {
        console.error('[store] addAppointment failed:', error)
        return { ok: false, reason: 'Could not save appointment. Try again.' }
      }
    },

    updateAppointment: async (id, input) => {
      const { username } = get()
      if (!username) return { ok: false, reason: 'Not signed in.' }
      if (slotConflict(get().appointments, input.date, input.time, id)) {
        return { ok: false, reason: 'That time is already booked on this day.' }
      }
      try {
        const updated = await updateAppointmentRow(id, username, input)
        set((state) => ({
          appointments: state.appointments
            .map((a) => (a.id === id ? updated : a))
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
        }))
        persist()
        return { ok: true }
      } catch (error) {
        console.error('[store] updateAppointment failed:', error)
        return { ok: false, reason: 'Could not update appointment.' }
      }
    },

    removeAppointment: async (id) => {
      await deleteAppointment(id)
      set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) }))
      persist()
    },

    addCompletedJob: async (job) => {
      const { userId, username } = get()
      if (!userId || !username) throw new Error('Not signed in')
      const inserted = await insertCompletedJob(userId, username, job)
      set((state) => ({ completedJobs: [inserted, ...state.completedJobs] }))
      persist()
      return inserted.id
    },

    updateCompletedJob: async (id, patch) => {
      const { username } = get()
      if (!username) return
      const updated = await updateCompletedJobRow(id, username, patch)
      if (!updated) return
      set((state) => ({
        completedJobs: state.completedJobs.map((j) => (j.id === id ? updated : j)),
      }))
      persist()
    },

    deleteCompletedJob: async (id) => {
      await deleteCompletedJob(id)
      set((state) => ({
        completedJobs: state.completedJobs.filter((j) => j.id !== id),
        // A deleted job leaves any linked route stop "to-do" again (DB sets the
        // FK to null via ON DELETE SET NULL; mirror that locally).
        routeStops: state.routeStops.map((s) =>
          s.completedJobId === id ? { ...s, completedJobId: null } : s,
        ),
      }))
      persist()
    },

    setJobPaid: async (id, paid, method) => {
      await get().updateCompletedJob(id, { paid, paymentMethod: paid ? method : undefined })
    },

    addRouteStop: async ({ clientId, date, time }) => {
      const { userId, username } = get()
      if (!userId || !username) return { ok: false, reason: 'Not signed in.' }
      const sameDay = get().routeStops.filter((s) => s.date === date)
      if (sameDay.some((s) => s.clientId === clientId)) {
        return { ok: false, reason: 'That client is already on this route.' }
      }
      let sortOrder: number
      if (time) {
        const [h, m] = time.split(':').map(Number)
        sortOrder = (h ?? 0) * 60 + (m ?? 0)
      } else {
        sortOrder = sameDay.reduce((max, s) => Math.max(max, s.sortOrder), -1) + 1
      }
      try {
        const stop = await insertRouteStop(userId, username, { clientId, date, sortOrder })
        set((state) => ({ routeStops: [...state.routeStops, stop] }))
        persist()
        return { ok: true }
      } catch (error) {
        console.error('[store] addRouteStop failed:', error)
        const reason = error instanceof Error ? error.message : 'Could not add stop. Try again.'
        return { ok: false, reason }
      }
    },

    removeRouteStop: async (id) => {
      await deleteRouteStop(id)
      set((state) => ({ routeStops: state.routeStops.filter((s) => s.id !== id) }))
      persist()
    },

    reorderRouteStops: async (date, orderedIds) => {
      const orders = orderedIds.map((id, index) => ({ id, sortOrder: index }))
      const orderMap = new Map(orders.map((o) => [o.id, o.sortOrder]))
      set((state) => ({
        routeStops: state.routeStops.map((s) =>
          s.date === date && orderMap.has(s.id) ? { ...s, sortOrder: orderMap.get(s.id) as number } : s,
        ),
      }))
      persist()
      try {
        await reorderRouteStops(orders)
      } catch (error) {
        console.error('[store] reorderRouteStops failed:', error)
      }
    },

    completeRouteStop: async (stopId, job) => {
      const { username } = get()
      if (!username) return
      const jobId = await get().addCompletedJob(job)
      try {
        const updated = await setRouteStopJob(stopId, username, jobId)
        set((state) => ({
          routeStops: state.routeStops.map((s) =>
            s.id === stopId ? updated ?? { ...s, completedJobId: jobId } : s,
          ),
        }))
      } catch (error) {
        console.error('[store] completeRouteStop link failed:', error)
        set((state) => ({
          routeStops: state.routeStops.map((s) =>
            s.id === stopId ? { ...s, completedJobId: jobId } : s,
          ),
        }))
      }
      persist()
    },

    reopenRouteStop: async (stopId) => {
      const stop = get().routeStops.find((s) => s.id === stopId)
      if (!stop) return
      if (stop.completedJobId) {
        // Deleting the job nulls the stop's link (handled in deleteCompletedJob).
        await get().deleteCompletedJob(stop.completedJobId)
      } else {
        set((state) => ({
          routeStops: state.routeStops.map((s) =>
            s.id === stopId ? { ...s, completedJobId: null } : s,
          ),
        }))
        persist()
      }
    },

    addExpense: async (input) => {
      const { userId, username } = get()
      if (!userId || !username) throw new Error('Not signed in')
      const inserted = await insertExpense(userId, username, input)
      set((state) => ({
        expenses: [inserted, ...state.expenses].sort((a, b) => b.date.localeCompare(a.date)),
      }))
      persist()
      return inserted.id
    },

    removeExpense: async (id) => {
      const target = get().expenses.find((e) => e.id === id)
      if (!target) return undefined
      await deleteExpenseRow(id)
      set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }))
      persist()
      return target
    },

    restoreExpense: async (expense) => {
      const { userId } = get()
      if (!userId) return
      await restoreExpenseRow(userId, expense)
      set((state) => ({
        expenses: [expense, ...state.expenses.filter((e) => e.id !== expense.id)].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      }))
      persist()
    },

    setSearchTerm: (searchTerm) => set({ searchTerm }),
    setViewMode: (viewMode) => set({ viewMode }),
  }
})

/** Times already taken on a date (for pickers). */
export function getBookedTimesForDate(
  appointments: ScheduledSlot[],
  date: string,
  excludeId?: string,
): Set<string> {
  const set = new Set<string>()
  for (const a of appointments) {
    if (a.date === date && a.id !== excludeId) set.add(a.time)
  }
  return set
}

/** 15-minute slots from 06:00–20:45 excluding booked times. */
export function getAvailableTimeOptions(booked: Set<string>): string[] {
  const out: string[] = []
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 20 && m > 45) break
      const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      if (!booked.has(t)) out.push(t)
    }
  }
  return out
}
