import { supabase } from './supabase'
import type {
  AppointmentRow,
  ClientRow,
  CompletedJobRow,
  PlanTier,
  ProfileRow,
} from '../types/database'
import type { Client, ClientFormInput, ScheduledSlot } from '../types/client'
import type { CompletedJob } from '../types/completedJob'

// ---------------- Mappers ----------------

export function clientFromRow(row: ClientRow, username: string): Client {
  return {
    id: row.id,
    username,
    fullName: row.full_name,
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    perCutRate: Number(row.per_cut_rate),
    expensePerClient: Number(row.expense_per_client),
    cutDurationMinutes: Number(row.cut_duration_minutes),
    serviceFrequency: row.service_frequency,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function appointmentFromRow(row: AppointmentRow, username: string): ScheduledSlot {
  return {
    id: row.id,
    username,
    clientId: row.client_id,
    date: row.date,
    time: row.time,
    createdAt: row.created_at,
  }
}

export function completedJobFromRow(row: CompletedJobRow, username: string): CompletedJob {
  return {
    id: row.id,
    username,
    clientId: row.client_id ?? '',
    clientName: row.client_name,
    date: row.date,
    earnings: Number(row.earnings),
    timeSpent: Number(row.time_spent),
    expenses: Number(row.expenses),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function clientFormToRow(input: ClientFormInput, userId: string) {
  return {
    user_id: userId,
    full_name: input.fullName,
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: input.address ?? '',
    per_cut_rate: input.perCutRate,
    expense_per_client: input.expensePerClient,
    cut_duration_minutes: input.cutDurationMinutes,
    service_frequency: input.serviceFrequency,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  }
}

// ---------------- Profile ----------------

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, account_name, plan, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('[api] fetchProfile failed:', error)
    return null
  }
  return data
}

export async function updateProfilePlan(userId: string, plan: PlanTier): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ plan })
    .eq('id', userId)
  if (error) {
    console.error('[api] updateProfilePlan failed:', error)
    throw error
  }
}

export async function updateProfileAccountName(
  userId: string,
  accountName: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ account_name: accountName })
    .eq('id', userId)
  if (error) {
    console.error('[api] updateProfileAccountName failed:', error)
    throw error
  }
}

// ---------------- Clients ----------------

export async function fetchClients(userId: string, username: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => clientFromRow(row as ClientRow, username))
}

export async function insertClient(
  userId: string,
  username: string,
  input: ClientFormInput,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(clientFormToRow(input, userId))
    .select('*')
    .single()
  if (error) throw error
  return clientFromRow(data as ClientRow, username)
}

export async function updateClientRow(
  id: string,
  username: string,
  input: ClientFormInput,
): Promise<Client> {
  const patch = {
    full_name: input.fullName,
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: input.address ?? '',
    per_cut_rate: input.perCutRate,
    expense_per_client: input.expensePerClient,
    cut_duration_minutes: input.cutDurationMinutes,
    service_frequency: input.serviceFrequency,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  }
  const { data, error } = await supabase
    .from('clients')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return clientFromRow(data as ClientRow, username)
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export async function restoreClientRow(userId: string, client: Client): Promise<void> {
  // Used for "undo delete" toast — re-insert the same row keeping its id.
  const { error } = await supabase.from('clients').insert({
    id: client.id,
    user_id: userId,
    full_name: client.fullName,
    phone: client.phone,
    email: client.email,
    address: client.address,
    per_cut_rate: client.perCutRate,
    expense_per_client: client.expensePerClient,
    cut_duration_minutes: client.cutDurationMinutes,
    service_frequency: client.serviceFrequency,
    notes: client.notes ?? null,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  })
  if (error) throw error
}

// ---------------- Appointments ----------------

export async function fetchAppointments(
  userId: string,
  username: string,
): Promise<ScheduledSlot[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => appointmentFromRow(row as AppointmentRow, username))
}

export async function insertAppointment(
  userId: string,
  username: string,
  input: { clientId: string; date: string; time: string },
): Promise<ScheduledSlot> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      client_id: input.clientId,
      date: input.date,
      time: input.time,
    })
    .select('*')
    .single()
  if (error) throw error
  return appointmentFromRow(data as AppointmentRow, username)
}

export async function updateAppointmentRow(
  id: string,
  username: string,
  input: { clientId: string; date: string; time: string },
): Promise<ScheduledSlot> {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      client_id: input.clientId,
      date: input.date,
      time: input.time,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return appointmentFromRow(data as AppointmentRow, username)
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}

// ---------------- Completed Jobs ----------------

export async function fetchCompletedJobs(
  userId: string,
  username: string,
): Promise<CompletedJob[]> {
  const { data, error } = await supabase
    .from('completed_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => completedJobFromRow(row as CompletedJobRow, username))
}

export async function insertCompletedJob(
  userId: string,
  username: string,
  job: Omit<CompletedJob, 'id' | 'username' | 'createdAt' | 'updatedAt'>,
): Promise<CompletedJob> {
  const { data, error } = await supabase
    .from('completed_jobs')
    .insert({
      user_id: userId,
      client_id: job.clientId || null,
      client_name: job.clientName,
      date: job.date,
      earnings: job.earnings,
      time_spent: job.timeSpent,
      expenses: job.expenses,
      notes: job.notes?.trim() ? job.notes.trim() : null,
    })
    .select('*')
    .single()
  if (error) throw error
  return completedJobFromRow(data as CompletedJobRow, username)
}

export async function updateCompletedJobRow(
  id: string,
  username: string,
  patch: Partial<CompletedJob>,
): Promise<CompletedJob | null> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.clientId !== undefined) dbPatch.client_id = patch.clientId || null
  if (patch.clientName !== undefined) dbPatch.client_name = patch.clientName
  if (patch.date !== undefined) dbPatch.date = patch.date
  if (patch.earnings !== undefined) dbPatch.earnings = patch.earnings
  if (patch.timeSpent !== undefined) dbPatch.time_spent = patch.timeSpent
  if (patch.expenses !== undefined) dbPatch.expenses = patch.expenses
  if (patch.notes !== undefined) {
    dbPatch.notes = patch.notes?.trim() ? patch.notes.trim() : null
  }
  const { data, error } = await supabase
    .from('completed_jobs')
    .update(dbPatch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data ? completedJobFromRow(data as CompletedJobRow, username) : null
}

export async function deleteCompletedJob(id: string): Promise<void> {
  const { error } = await supabase.from('completed_jobs').delete().eq('id', id)
  if (error) throw error
}
