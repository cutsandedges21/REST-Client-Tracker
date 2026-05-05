import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { clientSchema, type ClientSchema } from '../lib/validation'
import { cn } from '../lib/utils'
import type { Client } from '../types/client'
import { GlowCard } from './GlowCard'

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]'

interface ClientEditDialogProps {
  client: Client | null
  open: boolean
  onClose: () => void
  onSave: (values: ClientSchema) => Promise<void>
}

export function ClientEditDialog({ client, open, onClose, onSave }: ClientEditDialogProps) {
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
      reset({
        fullName: client.fullName,
        phone: client.phone,
        email: client.email,
        address: client.address,
        perCutRate: client.perCutRate,
        lawnSizeCategory: client.lawnSizeCategory,
        cutDurationMinutes: client.cutDurationMinutes,
        serviceFrequency: client.serviceFrequency,
        notes: client.notes ?? '',
      })
    }
  }, [client, open, reset])

  const submit = async (values: ClientSchema) => {
    await onSave(values)
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
                <h2 className="text-lg font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>Edit client</h2>
                <p className="mt-1 text-sm text-slate-600">{client.fullName}</p>

                <form className="mt-4 grid max-h-[70vh] gap-3 overflow-y-auto md:grid-cols-2" onSubmit={handleSubmit(submit)}>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Full name</span>
                    <input className={inputClass} {...register('fullName')} />
                    <FieldError error={errors.fullName?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Phone (optional)</span>
                    <input className={inputClass} placeholder="Leave blank if unknown" {...register('phone')} />
                    <FieldError error={errors.phone?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Email (optional)</span>
                    <input className={inputClass} placeholder="Leave blank if unknown" {...register('email')} />
                    <FieldError error={errors.email?.message} />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Address</span>
                    <input className={inputClass} {...register('address')} />
                    <FieldError error={errors.address?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Per cut (CAD)</span>
                    <input type="number" min={0} step="0.01" className={inputClass} {...register('perCutRate')} />
                    <FieldError error={errors.perCutRate?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Lawn size</span>
                    <select className={inputClass} {...register('lawnSizeCategory')}>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                    <FieldError error={errors.lawnSizeCategory?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Service frequency</span>
                    <select className={inputClass} {...register('serviceFrequency')}>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="three_weeks">Every 3 weeks</option>
                      <option value="monthly">Once a month</option>
                    </select>
                    <FieldError error={errors.serviceFrequency?.message} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Cut duration (min)</span>
                    <input type="number" min={1} className={inputClass} {...register('cutDurationMinutes')} />
                    <FieldError error={errors.cutDurationMinutes?.message} />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Notes (optional)</span>
                    <textarea rows={2} className={cn(inputClass, 'resize-none')} {...register('notes')} />
                    <FieldError error={errors.notes?.message} />
                  </label>

                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
                      style={{ backgroundColor: `rgb(var(--color-primary))` }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary-dark))`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary))`}
                    >
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
