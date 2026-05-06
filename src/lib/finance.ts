import type { Client, ServiceFrequency } from '../types/client'

/** Cuts per typical month (per your rules: weekly ×4, bi-weekly ×2, 3-week ×1, monthly ×1). */
export function getCutsPerMonth(frequency: ServiceFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 4
    case 'biweekly':
      return 2
    case 'three_weeks':
      return 1
    case 'monthly':
      return 1
    default:
      return 1
  }
}

export function getMonthlyRevenue(client: Pick<Client, 'perCutRate' | 'serviceFrequency'>): number {
  return client.perCutRate * getCutsPerMonth(client.serviceFrequency)
}

export function getMonthlyExpense(client: Pick<Client, 'expensePerClient' | 'serviceFrequency'>): number {
  return client.expensePerClient * getCutsPerMonth(client.serviceFrequency)
}

export function getMonthlyNet(client: Client): number {
  return getMonthlyRevenue(client) - getMonthlyExpense(client)
}

export function getMonthlyTimeMinutes(client: Pick<Client, 'cutDurationMinutes' | 'serviceFrequency'>): number {
  return client.cutDurationMinutes * getCutsPerMonth(client.serviceFrequency)
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2,
  }).format(amount)

export const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/** Total scheduled minutes in a typical month across all clients. */
export function formatTotalMonthlyTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export const getDashboardMetrics = (clients: Client[]) => {
  const totalClients = clients.length
  const totalMonthlyRevenue = clients.reduce((sum, client) => sum + getMonthlyRevenue(client), 0)
  const totalMonthlyExpense = clients.reduce((sum, client) => sum + getMonthlyExpense(client), 0)
  const totalMonthlyNet = totalMonthlyRevenue - totalMonthlyExpense
  const totalMonthlyMinutes = clients.reduce((sum, client) => sum + getMonthlyTimeMinutes(client), 0)

  return {
    totalClients,
    totalMonthlyRevenue,
    totalMonthlyExpense,
    totalMonthlyNet,
    totalMonthlyMinutes,
  }
}
