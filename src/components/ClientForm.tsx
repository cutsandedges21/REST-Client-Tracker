import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { clientSchema, type ClientSchema } from '../lib/validation'
import { cn } from '../lib/utils'
import { GlowCard } from './GlowCard'

interface ClientFormProps {
  onSubmit: (values: ClientSchema) => Promise<void>
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]'

export function ClientForm({ onSubmit }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.input<typeof clientSchema>, unknown, ClientSchema>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      lawnSizeCategory: 'medium',
      serviceFrequency: 'weekly',
      phone: '',
      email: '',
    },
  })

  const submit = async (values: ClientSchema) => {
    await onSubmit(values)
    reset({
      lawnSizeCategory: 'medium',
      serviceFrequency: 'weekly',
      phone: '',
      email: '',
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <GlowCard>
        <div className="p-5 md:p-6">
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>Add New Client</h2>
          <p className="mt-1 text-sm text-slate-600">
            Frequency and rate are used to estimate your monthly total. Phone and email are optional.
          </p>

          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Full Name</span>
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
              <span className="text-sm font-medium text-slate-700">Address</span>
              <input className={inputClass} placeholder="123 Main St" {...register('address')} />
              <FieldError error={errors.address?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Rate Per Visit (CAD)</span>
              <input type="number" min={0} step="0.01" className={inputClass} {...register('perCutRate')} />
              <FieldError error={errors.perCutRate?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Lawn Size</span>
              <select className={inputClass} {...register('lawnSizeCategory')}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <FieldError error={errors.lawnSizeCategory?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Service Frequency</span>
              <select className={inputClass} {...register('serviceFrequency')}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="three_weeks">Every 3 weeks</option>
                <option value="monthly">Once a month</option>
              </select>
              <FieldError error={errors.serviceFrequency?.message} />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Service Duration (minutes)</span>
              <input type="number" min={1} className={inputClass} {...register('cutDurationMinutes')} />
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

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: `var(--color-primary)` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary-dark)`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary)`}
              >
                {isSubmitting ? 'Saving...' : 'Add Client'}
              </button>
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
