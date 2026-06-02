import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { clientSchema, type ClientSchema } from '../lib/validation'
import type { ExpenseType, ServiceFrequency } from '../types/client'
import { cn } from '../lib/utils'
import { inputClass, labelClass, primaryButtonClass, primaryButtonStyle } from '../lib/ui'
import { GlowCard } from './GlowCard'
import { Segmented } from './Segmented'

interface ClientFormProps {
  onSubmit: (values: ClientSchema) => Promise<string>
  onSchedule?: (clientId: string, date: string, time: string) => Promise<void>
  atLimit?: boolean
  /** Lead sentence for the at-limit banner, e.g. "You've hit the 3-client limit on Free." */
  limitLead?: string
  /** Bold upgrade CTA label, e.g. "Upgrade to Pro". */
  limitCta?: string
  /** Trailing sentence, e.g. "for up to 10 clients." */
  limitTrail?: string
  onUpgradeRequired?: () => void
}

const FREQUENCY_OPTIONS: { value: ServiceFrequency; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'six_weeks', label: 'Every 6 weeks' },
  { value: 'two_months', label: 'Every 2 months' },
]

const TIME_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const total = 8 * 60 + i * 30 // 08:00 → 22:30 in 30-min steps
  const h = Math.floor(total / 60)
  const m = total % 60
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  const label = `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  return { value, label }
})

export function ClientForm({
  onSubmit,
  onSchedule,
  atLimit = false,
  limitLead = "You've hit your client limit on this plan.",
  limitCta = 'Upgrade',
  limitTrail = 'to add more clients.',
  onUpgradeRequired,
}: ClientFormProps) {
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes')
  const [expenseType, setExpenseType] = useState<ExpenseType>('fixed')
  const [scheduleClient, setScheduleClient] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.input<typeof clientSchema>, unknown, ClientSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      serviceFrequency: 'weekly',
      phone: '',
      email: '',
      expensePerClient: 0,
      expenseType: 'fixed',
    },
  })

  const resetForm = () => {
    reset({
      serviceFrequency: 'weekly',
      phone: '',
      email: '',
      expensePerClient: 0,
      expenseType: 'fixed',
    })
    setTimeUnit('minutes')
    setExpenseType('fixed')
    setScheduleClient(false)
    setScheduleDate('')
    setScheduleTime('')
  }

  const submit = async (values: ClientSchema) => {
    try {
      const processed: ClientSchema = {
        ...values,
        expenseType,
        cutDurationMinutes:
          timeUnit === 'hours'
            ? Math.round(values.cutDurationMinutes * 60)
            : Math.round(values.cutDurationMinutes),
      }
      const clientId = await onSubmit(processed)

      if (scheduleClient && onSchedule && scheduleDate && scheduleTime && clientId) {
        await onSchedule(clientId, scheduleDate, scheduleTime)
      }

      resetForm()
      toast.success('Client added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add client')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <GlowCard>
        <div className="p-5 md:p-6">
          <h2 className="font-display text-2xl font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
            Add client
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Rate and frequency drive your monthly projection. Phone and email are optional.
          </p>

          {atLimit && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <span className="mt-0.5 text-base">⚡</span>
              <div className="flex-1">
                {limitLead}{' '}
                <button
                  type="button"
                  onClick={onUpgradeRequired}
                  className="font-semibold underline underline-offset-2 hover:text-amber-700"
                >
                  {limitCta}
                </button>{' '}
                {limitTrail}
              </div>
            </div>
          )}

          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
            <label className="space-y-1.5">
              <span className={labelClass}>Full name *</span>
              <input className={inputClass} placeholder="Jordan Smith" {...register('fullName')} />
              <FieldError error={errors.fullName?.message} />
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>Address *</span>
              <input className={inputClass} placeholder="123 Main St" {...register('address')} />
              <FieldError error={errors.address?.message} />
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>Phone (optional)</span>
              <input className={inputClass} inputMode="tel" placeholder="Leave blank if unknown" {...register('phone')} />
              <FieldError error={errors.phone?.message} />
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>Email (optional)</span>
              <input className={inputClass} inputMode="email" placeholder="Used for invoices" {...register('email')} />
              <FieldError error={errors.email?.message} />
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>Rate per visit (CAD) *</span>
              <input type="number" min={0} step="0.01" inputMode="decimal" className={inputClass} {...register('perCutRate')} />
              <FieldError error={errors.perCutRate?.message} />
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>Service frequency *</span>
              <select className={inputClass} {...register('serviceFrequency')}>
                {FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FieldError error={errors.serviceFrequency?.message} />
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>
                Expense per visit {expenseType === 'percent' ? '(% of rate)' : '(CAD)'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className={inputClass}
                  placeholder={expenseType === 'percent' ? '20' : '0.00'}
                  {...register('expensePerClient', { valueAsNumber: true })}
                />
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

            <label className="space-y-1.5">
              <span className={labelClass}>Service duration *</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className={inputClass}
                  placeholder={timeUnit === 'hours' ? '1.5' : '90'}
                  {...register('cutDurationMinutes', { valueAsNumber: true })}
                />
                <Segmented<'minutes' | 'hours'>
                  ariaLabel="Duration unit"
                  value={timeUnit}
                  onChange={setTimeUnit}
                  options={[
                    { value: 'minutes', label: 'Min' },
                    { value: 'hours', label: 'Hr' },
                  ]}
                />
              </div>
              <FieldError error={errors.cutDurationMinutes?.message} />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className={labelClass}>Notes (optional)</span>
              <textarea
                rows={2}
                className={cn(inputClass, 'resize-none')}
                placeholder="Gate code, dog warning, schedule preference…"
                {...register('notes')}
              />
              <FieldError error={errors.notes?.message} />
            </label>

            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={scheduleClient}
                  onChange={(e) => setScheduleClient(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                  style={{ accentColor: 'rgb(var(--color-primary))' }}
                />
                <span className={labelClass}>Schedule first visit</span>
              </label>

              {scheduleClient && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className={labelClass}>Date</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Time</span>
                    <select className={inputClass} value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}>
                      <option value="">Select time…</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              {atLimit ? (
                <button
                  type="button"
                  onClick={onUpgradeRequired}
                  className={cn(primaryButtonClass, 'w-full opacity-80 hover:opacity-100 sm:w-auto')}
                  style={primaryButtonStyle}
                >
                  Upgrade to add more clients
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(primaryButtonClass, 'w-full sm:w-auto')}
                  style={primaryButtonStyle}
                >
                  {isSubmitting ? 'Saving…' : 'Add client'}
                </button>
              )}
            </div>
          </form>
        </div>
      </GlowCard>
    </motion.div>
  )
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-xs font-medium text-rose-600">{error}</p>
}
