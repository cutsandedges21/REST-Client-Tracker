import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
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

  const selectedClient = clients.find((c) => c.id === clientId)

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <select
                id="client"
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="earnings">Earnings (CAD)</Label>
              <Input
                id="earnings"
                type="number"
                step="0.01"
                min="0"
                value={earnings}
                onChange={(e) => setEarnings(e.target.value)}
                placeholder="0.00"
              />
              {errors.earnings && <p className="text-sm text-red-600">{errors.earnings}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timeSpent">Time Spent (minutes)</Label>
              <Input
                id="timeSpent"
                type="number"
                step="1"
                min="0"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="0"
              />
              {errors.timeSpent && <p className="text-sm text-red-600">{errors.timeSpent}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expenses">Expenses (CAD)</Label>
              <Input
                id="expenses"
                type="number"
                step="0.01"
                min="0"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0.00"
              />
              {errors.expenses && <p className="text-sm text-red-600">{errors.expenses}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Job</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
