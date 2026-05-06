import { create } from 'zustand'
import type { Client, ClientFormInput, ScheduledSlot, LawnSizeCategory, ServiceFrequency } from '../types/client'
import { db } from './db'
import { emailService } from '../services/emailService.js'

type ViewMode = 'cards' | 'table'

function legacyPerCut(raw: Record<string, unknown>): number {
  if (raw.perCutRate != null) return Number(raw.perCutRate)
  const hr = Number(raw.hourlyRate ?? 0)
  const dur = Number(raw.cutDurationMinutes ?? 0)
  return Number((hr * (dur / 60)).toFixed(2)) || hr
}

function normalizeClient(raw: Record<string, unknown>): Client {
  const serviceFrequency: ServiceFrequency =
    raw.serviceFrequency === 'weekly' ||
    raw.serviceFrequency === 'biweekly' ||
    raw.serviceFrequency === 'three_weeks' ||
    raw.serviceFrequency === 'monthly'
      ? raw.serviceFrequency as ServiceFrequency
      : 'weekly'

  return {
    id: String(raw.id),
    username: String(raw.username ?? ''),
    fullName: String(raw.fullName ?? ''),
    phone: String(raw.phone ?? '').trim(),
    email: String(raw.email ?? '').trim(),
    address: String(raw.address ?? ''),
    perCutRate: legacyPerCut(raw),
    expensePerClient: Number(raw.expensePerClient ?? 0),
    cutDurationMinutes: Number(raw.cutDurationMinutes ?? 0),
    serviceFrequency,
    notes: raw.notes ? String(raw.notes) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  }
}

interface ClientState {
  username: string | null
  clients: Client[]
  appointments: ScheduledSlot[]
  isLoaded: boolean
  searchTerm: string
  viewMode: ViewMode
  setUsername: (username: string) => void
  initialize: () => Promise<void>
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
  setSearchTerm: (term: string) => void
  setViewMode: (mode: ViewMode) => void
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
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
  username: null,
  clients: [],
  appointments: [],
  isLoaded: false,
  searchTerm: '',
  viewMode: 'cards',
  setUsername: (username) => set({ username, isLoaded: false }),
  initialize: async () => {
    if (get().isLoaded) return
    const username = get().username
    if (!username) return

    try {
      const rawClients = await db.clients.where('username').equals(username).reverse().toArray()
      const clients = rawClients.map((c) => normalizeClient(c as unknown as Record<string, unknown>))
      const appointments = await db.appointments.where('username').equals(username).toArray()
      set({ clients, appointments, isLoaded: true })
    } catch (error) {
      console.error('[ERROR] Failed to initialize:', error)
      throw error
    }
  },
  addClient: async (data) => {
    const username = get().username
    if (!username) {
      throw new Error('No username set')
    }
    const now = new Date().toISOString()
    const id = createId()
    const client: Client = {
      ...data,
      id,
      username,
      notes: data.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await db.clients.put(client)
      set((state) => ({ clients: [client, ...state.clients] }))
    } catch (error) {
      console.error('[ERROR] Failed to add client:', error)
      throw error
    }

    // Trigger email notification
    const userEmail = emailService.getUserEmail()
    if (userEmail) {
      void emailService
        .sendEmail({
          type: 'newClient',
          client,
        })
        .catch((error) => {
          console.error('Failed to send email notification:', error)
        })
    }

    return id
  },
  updateClient: async (id, data) => {
    const existing = get().clients.find((c) => c.id === id)
    if (!existing) return

    const updated: Client = {
      ...existing,
      ...data,
      notes: data.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }
    await db.clients.put(updated)
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? updated : c)),
    }))

    // Trigger email notification
    const userEmail = emailService.getUserEmail()
    if (userEmail) {
      void emailService
        .sendEmail({
          type: 'clientEdit',
          client: updated,
        })
        .catch((error) => {
          console.error('Failed to send email notification:', error)
        })
    }
  },
  removeClient: async (id) => {
    const target = get().clients.find((client) => client.id === id)
    if (!target) return undefined

    await db.clients.delete(id)
    const remainingAppointments = get().appointments.filter((a) => a.clientId !== id)
    await db.appointments.where('clientId').equals(id).delete()
    set((state) => ({
      clients: state.clients.filter((client) => client.id !== id),
      appointments: remainingAppointments,
    }))
    return target
  },
  restoreClient: async (client) => {
    await db.clients.put(client)
    set((state) => ({ clients: [client, ...state.clients.filter((item) => item.id !== client.id)] }))
  },
  addAppointment: async ({ clientId, date, time }) => {
    const username = get().username
    if (!username) {
      throw new Error('No username set')
    }
    if (slotConflict(get().appointments, date, time)) {
      return { ok: false, reason: 'That time is already booked on this day.' }
    }
    const now = new Date().toISOString()
    const slot: ScheduledSlot = {
      id: createId(),
      username,
      clientId,
      date,
      time,
      createdAt: now,
    }
    await db.appointments.put(slot)
    set((state) => ({
      appointments: [...state.appointments, slot].sort(
        (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
      ),
    }))
    return { ok: true }
  },
  updateAppointment: async (id, input) => {
    const list = get().appointments
    if (slotConflict(list, input.date, input.time, id)) {
      return { ok: false, reason: 'That time is already booked on this day.' }
    }
    const existing = list.find((a) => a.id === id)
    if (!existing) return { ok: false, reason: 'Appointment not found.' }

    const updated: ScheduledSlot = {
      ...existing,
      clientId: input.clientId,
      date: input.date,
      time: input.time,
    }
    await db.appointments.put(updated)
    set((state) => ({
      appointments: state.appointments
        .map((a) => (a.id === id ? updated : a))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    }))
    return { ok: true }
  },
  removeAppointment: async (id) => {
    await db.appointments.delete(id)
    set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) }))
  },
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setViewMode: (viewMode) => set({ viewMode }),
}))

/** Times already taken on a date (for pickers). */
export function getBookedTimesForDate(appointments: ScheduledSlot[], date: string, excludeId?: string): Set<string> {
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
