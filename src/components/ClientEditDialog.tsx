import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { clientSchema, type ClientSchema } from '../lib/validation'
import type { Client, ExpenseType, ServiceFrequency } from '../types/client'
import { cn } from '../lib/utils'
import { inputClass, labelClass, ghostButtonClass, primaryButtonClass, primaryButtonStyle } from '../lib/ui'
import { GlowCard } from './GlowCard'
import { Segmented } from './Segmented'

const FREQUENCY_OPTIONS: { value: ServiceFrequency; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'six_weeks', label: 'Every 6 weeks' },
  { value: 'two_months', label: 'Every 2 months' },
]

interface ClientEditDialogProps {
  client: Client | null
  open: boolean
  onClose: () => void
  onSave: (values: ClientSchema) => Promise<void>
}

export function ClientEditDialog({ client, open, onClose, onSave }: ClientEditDialogProps) {
  const [expenseType, setExpenseType] = useState<ExpenseType>('fixed')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof clientSchema>, unknown, ClientSchema>({
    resolver: zodResolver(clientSchema),
  })

  useEffect(() => {
    if (client && open) {
      setExpenseType(client.expenseType ?? 'fixed')
      reset({
        fullName: client.fullName,
        phone: client.phone,
        email: client.email,
        address: client.address,
        perCutRate: client.perCutRate,
        expensePerClient: client.expensePerClient,
        expenseType: client.expenseType ?? 'fixed',
        cutDurationMinutes: client.cutDurationMinutes,
        serviceFrequency: client.serviceFrequency,
        notes: client.notes ?? '',
      })
    }
  }, [client, open, reset])

  const submit = async (values: ClientSchema) => {
    await onSave({ ...values, expenseType })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && client ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <GlowCard>
              <div className="p-5 md:p-6">
                <h2 className="font-display text-xl font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
                  Edit client
                </h2>
                <p className="mt-1 text-sm text-slate-600">{client.fullName}</p>

                <form className="mt-4 grid max-h-[70vh] gap-3 overflow-y-auto sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
                  <label className="space-y-1 sm:col-span-2">
                    <span className={labelClass}>Full name</span>
                    <input className={inputClass} {...register('fullName')} />
                    <FieldError error={errors.fullName?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className={labelClass}>Phone (optional)</span>
                    <input className={inputClass} placeholder="Leave blank if unknown" {...register('phone')} />
                    <FieldError error={errors.phone?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className={labelClass}>Email (optional)</span>
                    <input className={inputClass} placeholder="Used for invoices" {...register('email')} />
                    <FieldError error={errors.email?.message} />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className={labelClass}>Address</span>
                    <input className={inputClass} {...register('address')} />
                    <FieldError error={errors.address?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className={labelClass}>Rate per visit (CAD)</span>
                    <input type="number" min={0} step="0.01" inputMode="decimal" className={inputClass} {...register('perCutRate')} />
                    <FieldError error={errors.perCutRate?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className={labelClass}>
                      Expense per visit {expenseType === 'percent' ? '(% of rate)' : '(CAD)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} step="0.01" inputMode="decimal" className={inputClass} {...register('expensePerClient', { valueAsNumber: true })} />
                      <Segmented<ExpenseType>
                        ariaLabel="Expense type"
                        value={expenseType}
                        onChange={setExpenseType}
                        options={[
                          { value: 'fixed', label: '$' },
                          { value: 'percent', label: '%' },
                        ]}
                      />
                    </div>
                    <FieldError error={errors.expensePerClient?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className={labelClass}>Service frequency</span>
                    <select className={inputClass} {...register('serviceFrequency')}>
                      {FREQUENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <FieldError error={errors.serviceFrequency?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className={labelClass}>Duration (min)</span>
                    <input type="number" min={1} inputMode="numeric" className={inputClass} {...register('cutDurationMinutes')} />
                    <FieldError error={errors.cutDurationMinutes?.message} />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className={labelClass}>Notes (optional)</span>
                    <textarea rows={2} className={cn(inputClass, 'resize-none')} {...register('notes')} />
                    <FieldError error={errors.notes?.message} />
                  </label>

                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button type="button" onClick={onClose} className={ghostButtonClass}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className={primaryButtonClass} style={primaryButtonStyle}>
                      {isSubmitting ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </div>
            </GlowCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-xs font-medium text-rose-600">{error}</p>
}
