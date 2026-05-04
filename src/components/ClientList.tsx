import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Clock3, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCurrency, formatDuration, getMonthlyRevenue } from '../lib/finance'
import { lawnSizeLabels, serviceFrequencyLabels } from '../lib/labels'
import { cn } from '../lib/utils'
import type { Client } from '../types/client'
import { GlowCard } from './GlowCard'

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

interface ClientListProps {
  clients: Client[]
  viewMode: 'cards' | 'table'
  onRemove: (client: Client) => void
  onEdit: (client: Client) => void
}

export function ClientList({ clients, viewMode, onRemove, onEdit }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <GlowCard>
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900">No clients yet</h3>
          <p className="mt-2 text-sm text-slate-600">Add your first client above to start tracking earnings.</p>
        </div>
      </GlowCard>
    )
  }

  return viewMode === 'cards' ? (
    <section className="grid gap-4 lg:grid-cols-2">
      <AnimatePresence>
        {clients.map((client) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24 }}
          >
            <GlowCard>
              <article className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{client.fullName}</h3>
                    <a
                      href={mapsUrl(client.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm underline decoration-[var(--color-primary-light)] underline-offset-2 transition hover:opacity-80"
                      style={{ color: `var(--color-primary-dark)` }}
                    >
                      {client.address}
                    </a>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEdit(client)}
                      className="rounded-lg p-2 text-slate-500 transition"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `var(--color-primary-light)`
                        e.currentTarget.style.color = `var(--color-primary-dark)`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                        e.currentTarget.style.color = ''
                      }}
                      aria-label={`Edit ${client.fullName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(client)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`Remove ${client.fullName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  {client.phone ? (
                    <a href={telHref(client.phone)} className="flex items-center gap-2 underline decoration-[var(--color-primary-light)] underline-offset-2 transition hover:opacity-80" style={{ color: `var(--color-primary-dark)` }}>
                      <Phone className="h-4 w-4 shrink-0" style={{ color: `var(--color-primary-dark)` }} />
                      <span>{client.phone}</span>
                    </a>
                  ) : (
                    <InfoRow icon={Phone} text="Phone not on file" muted />
                  )}
                  {client.email ? (
                    <a
                      href={`mailto:${encodeURIComponent(client.email)}`}
                      className="flex items-center gap-2 underline decoration-[var(--color-primary-light)] underline-offset-2 transition hover:opacity-80"
                      style={{ color: `var(--color-primary-dark)` }}
                    >
                      <Mail className="h-4 w-4 shrink-0" style={{ color: `var(--color-primary-dark)` }} />
                      <span>{client.email}</span>
                    </a>
                  ) : (
                    <InfoRow icon={Mail} text="Email not on file" muted />
                  )}
                  <InfoRow icon={MapPin} text={`${lawnSizeLabels[client.lawnSizeCategory]} lawn`} />
                  <InfoRow icon={CalendarClock} text={serviceFrequencyLabels[client.serviceFrequency]} />
                  <InfoRow icon={Clock3} text={`${formatDuration(client.cutDurationMinutes)} per cut`} />
                </div>

                {client.notes ? (
                  <p className="mt-4 rounded-xl border px-3 py-2 text-sm text-slate-800" style={{ borderColor: `var(--color-primary-light)`, backgroundColor: `var(--color-primary-light)` }}>
                    {client.notes}
                  </p>
                ) : null}

                <div className="mt-4 rounded-xl bg-slate-100/70 p-3">
                  <p className="text-xs font-medium text-slate-500">Per cut (CAD)</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(client.perCutRate)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Est. monthly: {formatCurrency(getMonthlyRevenue(client))}
                  </p>
                </div>
              </article>
            </GlowCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  ) : (
    <GlowCard>
      <div className="overflow-hidden rounded-[0.9375rem]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100/80 text-slate-600">
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Lawn</Th>
                <Th>Frequency</Th>
                <Th>Per cut</Th>
                <Th>Duration</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {clients.map((client) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="border-t border-slate-200/70"
                  >
                    <Td>
                      <p className="font-medium text-slate-900">{client.fullName}</p>
                      <p className="text-xs text-slate-500">{client.email || '—'}</p>
                    </Td>
                    <Td>{client.phone || '—'}</Td>
                    <Td>{lawnSizeLabels[client.lawnSizeCategory]}</Td>
                    <Td>{serviceFrequencyLabels[client.serviceFrequency]}</Td>
                    <Td>{formatCurrency(client.perCutRate)}</Td>
                    <Td>{formatDuration(client.cutDurationMinutes)}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => onRemove(client)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </GlowCard>
  )
}

function InfoRow({
  icon: Icon,
  text,
  muted,
}: {
  icon: typeof Phone
  text: string
  muted?: boolean
}) {
  return (
    <p className={cn('flex items-center gap-2', muted && 'text-slate-500')}>
      <Icon className="h-4 w-4 shrink-0" style={{ color: `var(--color-primary-dark)` }} />
      <span>{text}</span>
    </p>
  )
}

function Th({ children }: { children?: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>
}

function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-top text-slate-700', className)}>{children}</td>
}
