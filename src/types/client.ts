export type ServiceFrequency =
  | 'one_time'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'six_weeks'
  | 'two_months'

/** How `expensePerClient` is interpreted. */
export type ExpenseType = 'fixed' | 'percent'

export interface Client {
  id: string
  username: string
  fullName: string
  phone: string
  email: string
  address: string
  /** Flat amount charged per visit (CAD) */
  perCutRate: number
  /**
   * Either a flat dollar amount (when expenseType === 'fixed') or a percentage
   * of `perCutRate` (when expenseType === 'percent'). Use the helpers in
   * lib/finance.ts to resolve the effective dollar cost.
   */
  expensePerClient: number
  expenseType: ExpenseType
  cutDurationMinutes: number
  serviceFrequency: ServiceFrequency
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ClientFormInput {
  fullName: string
  phone: string
  email: string
  address: string
  perCutRate: number
  expensePerClient: number
  expenseType: ExpenseType
  cutDurationMinutes: number
  serviceFrequency: ServiceFrequency
  notes?: string
}

export interface ScheduledSlot {
  id: string
  username: string
  clientId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm (24h) */
  time: string
  createdAt: string
}
