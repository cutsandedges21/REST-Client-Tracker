import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlowCard } from './GlowCard'
import type { Client } from '../types/client'

interface CompleteJobDialogProps {
  open: boolean
  onClose: () => void
  onSave: (job: {
    clientId: string
    clientName: string
    date: string
    earnings: number
    timeSpent: number
    expenses: number
    notes?: string
  }) => void
  clients: Client[]
  preselectedClientId?: string
}

export function CompleteJobDialog({
  open,
  onClose,
  onSave,
  clients,
  preselectedClientId,
}: CompleteJobDialogProps) {
  const [clientId, setClientId] = useState(preselectedClientId || clients[0]?.id || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [earnings, setEarnings] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [expenses, setExpenses] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-fill when client changes
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId)
    const client = clients.find((c) => c.id === newClientId)
    if (client) {
      setEarnings(client.perCutRate.toString())
      setTimeSpent(client.cutDurationMinutes.toString())
      setExpenses(client.expensePerClient.toString())
    }
  }

  // Auto-fill on mount if preselected
  if (preselectedClientId && !clientId) {
    const client = clients.find((c) => c.id === preselectedClientId)
    if (client) {
      setClientId(preselectedClientId)
      setEarnings(client.perCutRate.toString())
      setTimeSpent(client.cutDurationMinutes.toString())
      setExpenses(client.expensePerClient.toString())
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!clientId) {
      newErrors.clientId = 'Please select a client'
    }

    if (!date) {
      newErrors.date = 'Please enter a date'
    } else {
      const jobDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (jobDate > today) {
        newErrors.date = 'Date cannot be in the future'
      }
    }

    const earningsNum = parseFloat(earnings)
    if (isNaN(earningsNum) || earningsNum < 0) {
      newErrors.earnings = 'Please enter a valid amount'
    }

    const timeSpentNum = parseFloat(timeSpent)
    if (isNaN(timeSpentNum) || timeSpentNum < 0) {
      newErrors.timeSpent = 'Please enter a valid time'
    }

    const expensesNum = parseFloat(expenses)
    if (isNaN(expensesNum) || expensesNum < 0) {
      newErrors.expenses = 'Please enter a valid amount'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const client = clients.find((c) => c.id === clientId)
    if (!client) {
      return
    }

    onSave({
      clientId,
      clientName: client.fullName,
      date,
      earnings: parseFloat(earnings),
      timeSpent: parseFloat(timeSpent),
      expenses: parseFloat(expenses),
      notes: notes.trim() || undefined,
    })

    // Reset form
    setDate(new Date().toISOString().split('T')[0])
    setEarnings('')
    setTimeSpent('')
    setExpenses('')
    setNotes('')
    setErrors({})
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/35 backdrop-blur-sm"
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md"
            >
              <GlowCard>
                <div className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">Complete Job</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="client" className="text-sm font-medium text-slate-700">Client</label>
                      <select
                        id="client"
                        value={clientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      >
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.fullName}
                          </option>
                        ))}
                      </select>
                      {errors.clientId && <p className="text-sm text-red-600">{errors.clientId}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="date" className="text-sm font-medium text-slate-700">Date</label>
                      <input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      />
                      {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="earnings" className="text-sm font-medium text-slate-700">Earnings (CAD)</label>
                      <input
                        id="earnings"
                        type="number"
                        step="0.01"
                        min="0"
                        value={earnings}
                        onChange={(e) => setEarnings(e.target.value)}
                        placeholder="0.00"
                        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      />
                      {errors.earnings && <p className="text-sm text-red-600">{errors.earnings}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="timeSpent" className="text-sm font-medium text-slate-700">Time Spent (minutes)</label>
                      <input
                        id="timeSpent"
                        type="number"
                        step="1"
                        min="0"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        placeholder="0"
                        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      />
                      {errors.timeSpent && <p className="text-sm text-red-600">{errors.timeSpent}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="expenses" className="text-sm font-medium text-slate-700">Expenses (CAD)</label>
                      <input
                        id="expenses"
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        placeholder="0.00"
                        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      />
                      {errors.expenses && <p className="text-sm text-red-600">{errors.expenses}</p>}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="notes" className="text-sm font-medium text-slate-700">Notes (optional)</label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional details..."
                        rows={3}
                        className="flex w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Save Job
                    </button>
                  </div>
                </form>
              </div>
            </GlowCard>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
