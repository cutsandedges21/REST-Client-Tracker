import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { expenseSchema, type ExpenseSchema } from '../lib/validation'
import { formatCurrency } from '../lib/finance'
import { inputClass, labelClass, primaryButtonClass, primaryButtonStyle } from '../lib/ui'
import { useClientStore } from '../store/clientStore'
import { GlowCard } from './GlowCard'

export function ExpensesCard() {
  const expenses = useClientStore((s) => s.expenses)
  const addExpense = useClientStore((s) => s.addExpense)
  const removeExpense = useClientStore((s) => s.removeExpense)
  const restoreExpense = useClientStore((s) => s.restoreExpense)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof expenseSchema>, unknown, ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: '', date: undefined },
  })

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const submit = async (values: ExpenseSchema) => {
    try {
      await addExpense({ description: values.description, amount: values.amount, date: values.date })
      reset({ description: '', amount: '', date: undefined })
      toast.success('Expense added')
    } catch {
      toast.error('Could not add expense')
    }
  }

  const onDelete = async (id: string) => {
    const removed = await removeExpense(id)
    if (removed) {
      toast.success('Expense removed', {
        action: { label: 'Undo', onClick: () => void restoreExpense(removed) },
      })
    }
  }

  return (
    <GlowCard>
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
              Expenses
            </h2>
            <p className="mt-1 text-sm text-slate-600">Gas, equipment, supplies — your business costs.</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Total</p>
            <p className="stat-figure text-2xl" style={{ color: `rgb(var(--color-primary-dark))` }}>
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={handleSubmit(submit)}>
          <label className="space-y-1.5">
            <span className={labelClass}>Description</span>
            <input className={inputClass} placeholder="Gas, blades, string trimmer…" {...register('description')} />
            {errors.description && <p className="text-xs font-medium text-rose-600">{errors.description.message}</p>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Amount ($)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className={`${inputClass} sm:w-32`}
              placeholder="25.00"
              {...register('amount')}
            />
            {errors.amount && <p className="text-xs font-medium text-rose-600">{errors.amount.message}</p>}
          </label>
          <div>
            <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} w-full sm:w-auto`} style={primaryButtonStyle}>
              {isSubmitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>

        {expenses.length > 0 && (
          <ul className="mt-5 space-y-2">
            {expenses.slice(0, 12).map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{expense.description}</p>
                  <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString('en-CA')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular text-slate-900">{formatCurrency(expense.amount)}</span>
                  <button
                    type="button"
                    onClick={() => void onDelete(expense.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${expense.description}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlowCard>
  )
}
