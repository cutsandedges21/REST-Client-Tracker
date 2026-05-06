export type LawnSizeCategory = 'small' | 'medium' | 'large'

export type ServiceFrequency = 'weekly' | 'biweekly' | 'three_weeks' | 'monthly'

export interface Client {
  id: string
  username: string
  fullName: string
  phone: string
  email: string
  address: string
  /** Flat amount charged per lawn cut (CAD) */
  perCutRate: number
  expensePerClient: number
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
