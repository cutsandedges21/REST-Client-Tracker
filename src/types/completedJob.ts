import type { PaymentMethod } from './route'

export interface CompletedJob {
  id: string
  username: string
  clientId: string
  clientName: string
  date: string
  earnings: number
  timeSpent: number
  expenses: number
  /** Whether the client has paid for this visit yet. */
  paid: boolean
  /** How they paid (only meaningful when paid). */
  paymentMethod?: PaymentMethod
  notes?: string
  createdAt: string
  updatedAt: string
}

export type TimeRange = '1D' | '1W' | '2W' | '1M' | '1Y'
