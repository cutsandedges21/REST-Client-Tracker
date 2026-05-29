import { create } from 'zustand'
import type { Client, ClientFormInput, ScheduledSlot } from '../types/client'
import type { CompletedJob } from '../types/completedJob'
import type { Expense, ExpenseFormInput } from '../types/expense'
import { isSpecialUser, type PlanId } from '../lib/plans'
import {
  deleteAppointment,
  deleteClient,
  deleteCompletedJob,
  deleteExpenseRow,
  fetchAppointments,
  fetchClients,
  fetchCompletedJobs,
  fetchExpenses,
  insertAppointment,
  insertClient,
  insertCompletedJob,
  insertExpense,
  restoreClientRow,
  restoreExpenseRow,
  updateAppointmentRow,
  updateClientRow,
  updateCompletedJobRow,
  updateProfilePlan,
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
}

interface ClientState {
  userId: string | null
  username: string | null
  plan: PlanId
  clients: Client[]
  appointments: ScheduledSlot[]
  completedJobs: CompletedJob[]
  expenses: Expense[]
  isLoaded: boolean
  searchTerm: string
  viewMode: ViewMode

  setAuthBundle: (bundle: AuthBundle | null) => void
  setPlan: (plan: PlanId) => Promise<void>
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
    const { username, clients, appointments, completedJobs, expenses } = get()
    writeSnapshot(username, { clients, appointments, completedJobs, expenses })
  }

  return {
    userId: null,
    username: null,
    plan: 'free',
    clients: [],
    appointments: [],
    completedJobs: [],
    expenses: [],
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
          isLoaded: false,
        })
        return
      }
      // Special users always have full access — force enterprise regardless of stored plan.
      const effectivePlan = isSpecialUser(bundle.username) ? 'enterprise' : bundle.plan

      // Load-on-login: hydrate instantly from the last local snapshot (if any),
      // so the UI shows data immediately while the network refresh runs.
      const cached = readSnapshot(bundle.username)
      set({
        userId: bundle.userId,
        username: bundle.username,
        plan: effectivePlan,
        clients: cached?.clients ?? [],
        appointments: cached?.appointments ?? [],
        completedJobs: cached?.completedJobs ?? [],
        expenses: cached?.expenses ?? [],
        isLoaded: cached !== null,
      })
      void get().refresh()
    },

    setPlan: async (plan) => {
      const { userId } = get()
      if (!userId) return
      set({ plan })
      try {
        await updateProfilePlan(userId, plan)
      } catch (error) {
        console.error('[store] failed to update plan:', error)
      }
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
        // Expenses are best-effort: the table may not exist until the latest
        // migration is applied — don't let that block the rest of the app.
        let expenses = get().expenses
        try {
          expenses = await fetchExpenses(userId, username)
        } catch (expenseError) {
          console.warn('[store] expenses fetch failed (run the latest schema.sql?):', expenseError)
        }
        set({ clients, appointments, completedJobs, expenses, isLoaded: true })
        persist()
      } catch (error) {
        console.error('[store] refresh failed:', error)
        set({ isLoaded: true }) // unblock the UI; user sees cached/empty state
      }
    },

    saveAndClear: () => {
      persist()
      set({
        userId: null,
        username: null,
        plan: 'free',
        clients: [],
        appointments: [],
        completedJobs: [],
        expenses: [],
        isLoaded: false,
        searchTerm: '',
      })
    },

    addClient: async (data) => {
      const { userId, username, plan, clients } = get()
      if (!userId || !username) throw new Error('Not signed in')

      if (!isSpecialUser(username) && plan === 'free' && clients.length >= 3) {
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
      }))
      persist()
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
