import { create } from 'zustand'
import type { Client, ClientFormInput, ScheduledSlot } from '../types/client'
import type { CompletedJob } from '../types/completedJob'
import { isSpecialUser, type PlanId } from '../lib/plans'
import {
  deleteAppointment,
  deleteClient,
  deleteCompletedJob,
  fetchAppointments,
  fetchClients,
  fetchCompletedJobs,
  insertAppointment,
  insertClient,
  insertCompletedJob,
  restoreClientRow,
  updateAppointmentRow,
  updateClientRow,
  updateCompletedJobRow,
  updateProfilePlan,
} from '../lib/api'
import { emailService } from '../services/emailService.js'

type ViewMode = 'cards' | 'table'

type AuthBundle = {
  userId: string
  username: string
  plan: PlanId
}

interface ClientState {
  userId: string | null
  username: string | null
  plan: PlanId
  clients: Client[]
  appointments: ScheduledSlot[]
  completedJobs: CompletedJob[]
  isLoaded: boolean
  searchTerm: string
  viewMode: ViewMode

  setAuthBundle: (bundle: AuthBundle | null) => void
  setPlan: (plan: PlanId) => Promise<void>
  refresh: () => Promise<void>

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

export const useClientStore = create<ClientState>((set, get) => ({
  userId: null,
  username: null,
  plan: 'free',
  clients: [],
  appointments: [],
  completedJobs: [],
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
        isLoaded: false,
      })
      emailService.setUsername(null)
      return
    }
    // Special users always have full access — force the max (enterprise) plan regardless of stored plan.
    const effectivePlan = isSpecialUser(bundle.username) ? 'enterprise' : bundle.plan
    set({
      userId: bundle.userId,
      username: bundle.username,
      plan: effectivePlan,
      isLoaded: false,
    })
    emailService.setUsername(bundle.username)
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
      const [clients, appointments, completedJobs] = await Promise.all([
        fetchClients(userId, username),
        fetchAppointments(userId, username),
        fetchCompletedJobs(userId, username),
      ])
      set({ clients, appointments, completedJobs, isLoaded: true })
    } catch (error) {
      console.error('[store] refresh failed:', error)
      set({ isLoaded: true }) // unblock the UI; user sees empty state
    }
  },

  addClient: async (data) => {
    const { userId, username, plan, clients } = get()
    if (!userId || !username) throw new Error('Not signed in')

    // Special users get unlimited clients; only enforce limits for others on free plan.
    if (!isSpecialUser(username) && plan === 'free' && clients.length >= 3) {
      throw new Error('Client limit reached. Upgrade to Pro for unlimited clients.')
    }

    const inserted = await insertClient(userId, username, data)
    set((state) => ({ clients: [inserted, ...state.clients] }))

    const userEmail = emailService.getUserEmail()
    if (userEmail) {
      void emailService
        .sendEmail({ type: 'newClient', client: inserted })
        .catch((err) => console.error('Failed to send email notification:', err))
    }
    return inserted.id
  },

  updateClient: async (id, data) => {
    const { username } = get()
    if (!username) return
    const updated = await updateClientRow(id, username, data)
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? updated : c)),
    }))
    const userEmail = emailService.getUserEmail()
    if (userEmail) {
      void emailService
        .sendEmail({ type: 'clientEdit', client: updated })
        .catch((err) => console.error('Failed to send email notification:', err))
    }
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
    return target
  },

  restoreClient: async (client) => {
    const { userId } = get()
    if (!userId) return
    await restoreClientRow(userId, client)
    set((state) => ({
      clients: [client, ...state.clients.filter((item) => item.id !== client.id)],
    }))
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
      return { ok: true }
    } catch (error) {
      console.error('[store] updateAppointment failed:', error)
      return { ok: false, reason: 'Could not update appointment.' }
    }
  },

  removeAppointment: async (id) => {
    await deleteAppointment(id)
    set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) }))
  },

  addCompletedJob: async (job) => {
    const { userId, username } = get()
    if (!userId || !username) throw new Error('Not signed in')
    const inserted = await insertCompletedJob(userId, username, job)
    set((state) => ({ completedJobs: [...state.completedJobs, inserted] }))
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
  },

  deleteCompletedJob: async (id) => {
    await deleteCompletedJob(id)
    set((state) => ({
      completedJobs: state.completedJobs.filter((j) => j.id !== id),
    }))
  },

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setViewMode: (viewMode) => set({ viewMode }),
}))

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
