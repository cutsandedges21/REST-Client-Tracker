export interface Expense {
  id: string
  username: string
  description: string
  /** Dollar amount (CAD) */
  amount: number
  /** YYYY-MM-DD */
  date: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseFormInput {
  description: string
  amount: number
  /** YYYY-MM-DD — defaults to today when omitted */
  date?: string
}
