export interface CompletedJob {
  id: string
  username: string
  clientId: string
  clientName: string
  date: string
  earnings: number
  timeSpent: number
  expenses: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type TimeRange = '1D' | '1W' | '2W' | '1M' | '1Y'
