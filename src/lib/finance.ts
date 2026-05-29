import type { Client, ExpenseType, ServiceFrequency } from '../types/client'

/**
 * Visits in a typical month for a given frequency. Uses a simple, intuitive
 * 4-weeks-per-month model so the numbers come out clean (weekly = 4×, bi-weekly
 * = 2×, monthly = 1×). One-time clients add nothing to recurring projections.
 */
export function getCutsPerMonth(frequency: ServiceFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 4
    case 'biweekly':
      return 2
    case 'monthly':
      return 1
    case 'six_weeks':
      return 4 / 6 // every 6 weeks ≈ 0.67×/month
    case 'two_months':
      return 0.5
    case 'one_time':
      return 0
    default:
      return 1
  }
}

/**
 * Resolve the effective per-visit expense in dollars, honouring whether the
 * client's expense is a flat amount or a percentage of the per-visit rate.
 */
export function getExpensePerVisit(
  client: Pick<Client, 'perCutRate' | 'expensePerClient' | 'expenseType'>,
): number {
  if (client.expenseType === 'percent') {
    return client.perCutRate * (client.expensePerClient / 100)
  }
  return client.expensePerClient
}

export function getMonthlyRevenue(client: Pick<Client, 'perCutRate' | 'serviceFrequency'>): number {
  return client.perCutRate * getCutsPerMonth(client.serviceFrequency)
}

export function getMonthlyExpense(
  client: Pick<Client, 'perCutRate' | 'expensePerClient' | 'expenseType' | 'serviceFrequency'>,
): number {
  return getExpensePerVisit(client) * getCutsPerMonth(client.serviceFrequency)
}

export function getMonthlyNet(client: Client): number {
  return getMonthlyRevenue(client) - getMonthlyExpense(client)
}

export function getMonthlyTimeMinutes(
  client: Pick<Client, 'cutDurationMinutes' | 'serviceFrequency'>,
): number {
  return client.cutDurationMinutes * getCutsPerMonth(client.serviceFrequency)
}

// ---------------- Profit math ----------------

/**
 * Profit margin = profit / revenue × 100. "How much of each dollar earned is profit."
 */
export function profitMargin(revenue: number, expense: number): number {
  if (revenue <= 0) return 0
  return ((revenue - expense) / revenue) * 100
}

/**
 * Markup = profit / cost × 100. "How many times you made back your cost."
 */
export function profitMarkup(revenue: number, expense: number): number {
  if (expense <= 0) return 0
  return ((revenue - expense) / expense) * 100
}

/** Earnings per hour. minutes === 0 → 0. */
export function hourlyRate(earnings: number, minutes: number): number {
  if (minutes <= 0) return 0
  return earnings / (minutes / 60)
}

// ---------------- Formatting ----------------

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)

export const formatPercent = (value: number, fractionDigits = 1) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(fractionDigits)}%`

export const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/** Total scheduled minutes in a typical month across all clients. */
export function formatTotalMonthlyTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min'
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
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

export type { ExpenseType }
