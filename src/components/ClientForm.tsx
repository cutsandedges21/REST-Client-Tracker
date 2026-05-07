import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { clientSchema, type ClientSchema } from '../lib/validation'
import { cn } from '../lib/utils'
import { GlowCard } from './GlowCard'

interface ClientFormProps {
  onSubmit: (values: ClientSchema) => Promise<string>
  onSchedule?: (clientId: string, date: string, time: string) => Promise<void>
  atLimit?: boolean
  onUpgradeRequired?: () => void
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]'

export function ClientForm({ onSubmit, onSchedule, atLimit = false, onUpgradeRequired }: ClientFormProps) {
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes')
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
    },
  })

  const submit = async (values: ClientSchema) => {
    console.log('[DEBUG] ClientForm submit called with values:', values)
    try {
      // Convert hours to minutes if needed
      const processedValues = {
        ...values,
        cutDurationMinutes: timeUnit === 'hours' ? values.cutDurationMinutes * 60 : values.cutDurationMinutes,
      }
      const clientId = await onSubmit(processedValues)
      console.log('[DEBUG] ClientForm submit completed successfully, clientId:', clientId)

      // Schedule the client if option is selected
      if (scheduleClient && onSchedule && scheduleDate && scheduleTime && clientId) {
        console.log('[DEBUG] Scheduling client for:', scheduleDate, scheduleTime)
        await onSchedule(clientId, scheduleDate, scheduleTime)
      }

      reset({
        serviceFrequency: 'weekly',
        phone: '',
        email: '',
        expensePerClient: 0,
      })
      setScheduleClient(false)
      setScheduleDate('')
      setScheduleTime('')
    } catch (error) {
      console.error('[ERROR] ClientForm submit failed:', error)
      throw error
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <GlowCard>
        <div className="p-5 md:p-6">
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>Add New Client</h2>
          <p className="mt-1 text-sm text-slate-600">
            Frequency and rate are used to estimate your monthly total. Phone and email are optional.
          </p>

          {atLimit && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <span className="mt-0.5 text-base">⚡</span>
              <div className="flex-1">
                You've hit the 3-client limit on the Free plan.{' '}
                <button
                  type="button"
                  onClick={onUpgradeRequired}
                  className="font-semibold underline underline-offset-2 hover:text-amber-700"
                >
                  Upgrade to Pro
                </button>{' '}
                for unlimited clients.
              </div>
            </div>
          )}

          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Full Name *</span>
              <input className={inputClass} placeholder="Mossimo Bianco" {...register('fullName')} />
              <FieldError error={errors.fullName?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Phone (optional)</span>
              <input className={inputClass} placeholder="Leave blank if you don&apos;t have it" {...register('phone')} />
              <FieldError error={errors.phone?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Email (optional)</span>
              <input className={inputClass} placeholder="Leave blank if you don&apos;t have it" {...register('email')} />
              <FieldError error={errors.email?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Address *</span>
              <input className={inputClass} placeholder="123 Main St" {...register('address')} />
              <FieldError error={errors.address?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Job Cost (CAD) *</span>
              <input type="number" min={0} step="0.01" className={inputClass} {...register('perCutRate')} />
              <FieldError error={errors.perCutRate?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Expense per Client (CAD) *</span>
              <input type="number" min={0} step="0.01" className={inputClass} {...register('expensePerClient', { valueAsNumber: true })} />
              <FieldError error={errors.expensePerClient?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Service Frequency *</span>
              <select className={inputClass} {...register('serviceFrequency')}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="three_weeks">Every 3 weeks</option>
                <option value="monthly">Once a month</option>
              </select>
              <FieldError error={errors.serviceFrequency?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Service Duration *</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  placeholder={timeUnit === 'hours' ? '1.5' : '90'}
                  {...register('cutDurationMinutes', { valueAsNumber: true })}
                />
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as 'minutes' | 'hours')}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
              <FieldError error={errors.cutDurationMinutes?.message} />
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Notes (optional)</span>
              <textarea
                rows={3}
                className={cn(inputClass, 'resize-none')}
                placeholder="Gate code, dog warning, schedule preference..."
                {...register('notes')}
              />
              <FieldError error={errors.notes?.message} />
            </label>

            <div className="md:col-span-2 space-y-4 rounded-lg border border-slate-200 bg-slate-0 p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scheduleClient}
                  onChange={(e) => setScheduleClient(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm font-medium text-slate-700">Schedule first appointment</span>
              </label>

              {scheduleClient && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Date</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Time</span>
                    <select
                      className={inputClass}
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    >
                      <option value="">Select time...</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="08:30">8:30 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="09:30">9:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="12:30">12:30 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="13:30">1:30 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="14:30">2:30 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="15:30">3:30 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="16:30">4:30 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="17:30">5:30 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="18:30">6:30 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="19:30">7:30 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="20:30">8:30 PM</option>
                      <option value="21:00">9:00 PM</option>
                      <option value="21:30">9:30 PM</option>
                      <option value="22:00">10:00 PM</option>
                      <option value="22:30">10:30 PM</option>
                      <option value="23:00">11:00 PM</option>
                      <option value="23:30">11:30 PM</option>
                    </select>
                  </label>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              {atLimit ? (
                <button
                  type="button"
                  onClick={onUpgradeRequired}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white opacity-80 transition hover:opacity-100"
                  style={{ backgroundColor: `rgb(var(--color-primary))` }}
                >
                  Upgrade to add more clients
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: `rgb(var(--color-primary))` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary-dark))`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary))`}
                >
                  {isSubmitting ? 'Saving...' : 'Add Client'}
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
