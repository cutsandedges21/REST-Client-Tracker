import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Clock3, FileText, Mail, Pencil, Phone, Trash2, Check, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  formatCurrency,
  formatDuration,
  getExpensePerVisit,
  getMonthlyNet,
  getMonthlyRevenue,
} from '../lib/finance'
import { serviceFrequencyLabels } from '../lib/labels'
import { cn } from '../lib/utils'
import type { Client } from '../types/client'
import type { CardDensity } from '../store/clientStore'
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe'
import { GlowCard } from './GlowCard'

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

interface CardActions {
  onRemove: (client: Client) => void
  onEdit: (client: Client) => void
  onCompleteJob?: (client: Client) => void
  onInvoice?: (client: Client) => void
}

interface ClientListProps extends CardActions {
  clients: Client[]
  density?: CardDensity
}

function expenseDisplay(client: Client): string {
  const dollars = formatCurrency(getExpensePerVisit(client))
  return client.expenseType === 'percent' ? `${dollars} (${client.expensePerClient}%)` : dollars
}

export function ClientList({ clients, density = 'full', ...actions }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <GlowCard>
        <div className="p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-slate-900">No clients yet</h3>
          <p className="mt-2 text-sm text-slate-600">Add your first client below to start tracking earnings.</p>
        </div>
      </GlowCard>
    )
  }

  return <CardsView clients={clients} density={density} {...actions} />
}

function CardsView({ clients, density, ...actions }: { clients: Client[]; density: CardDensity } & CardActions) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const reduce = useReducedMotionSafe()

  // Derive the open client from the live list so the overlay reflects edits and
  // closes automatically if the client disappears (e.g. deleted elsewhere).
  const expanded = expandedId ? clients.find((c) => c.id === expandedId) ?? null : null

  // Escape to close + lock body scroll while the focused overlay is open.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedId(null)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [expanded])

  if (density === 'full') {
    return (
      <section className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {clients.map((client) => (
            <motion.div
              key={client.id}
              className="min-w-0"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.24 }}
            >
              <GlowCard>
                <ClientCardBody client={client} {...actions} />
              </GlowCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    )
  }

  const gridClass = density === 'grid' ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-2 sm:grid-cols-4'

  return (
    <>
      <section className={cn('grid', gridClass)}>
        {clients.map((client) => (
          <CompactClientCard
            key={client.id}
            client={client}
            density={density}
            reduce={reduce}
            onOpen={() => setExpandedId(client.id)}
          />
        ))}
      </section>

      <AnimatePresence>
        {expanded && (
          <ExpandedCardOverlay
            client={expanded}
            reduce={reduce}
            onClose={() => setExpandedId(null)}
            {...actions}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/** Small card for grid/compact density: name, price, and (grid only) frequency. */
function CompactClientCard({
  client,
  density,
  reduce,
  onOpen,
}: {
  client: Client
  density: CardDensity
  reduce: boolean
  onOpen: () => void
}) {
  const compact = density === 'compact'
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${client.fullName}`}
      className="h-full min-w-0 rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2"
      layoutId={reduce ? undefined : `client-card-${client.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <GlowCard className="h-full">
        <div className={cn('flex h-full flex-col justify-between gap-1', compact ? 'p-3' : 'p-4')}>
          <h3 className={cn('truncate font-display font-semibold text-slate-900', compact ? 'text-sm' : 'text-base')}>
            {client.fullName}
          </h3>
          <div className="min-w-0">
            <p
              className={cn('truncate font-semibold tabular text-slate-900', compact ? 'text-sm' : 'text-base')}
            >
              {formatCurrency(client.perCutRate)}
            </p>
            {!compact && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {serviceFrequencyLabels[client.serviceFrequency]}
              </p>
            )}
          </div>
        </div>
      </GlowCard>
    </motion.button>
  )
}

/** Focused overlay that expands a small card into the full card. */
function ExpandedCardOverlay({
  client,
  reduce,
  onClose,
  onRemove,
  onEdit,
  onCompleteJob,
  onInvoice,
}: { client: Client; reduce: boolean; onClose: () => void } & CardActions) {
  // Close the overlay before running an action that opens its own dialog.
  const after = (fn: (c: Client) => void) => (c: Client) => {
    onClose()
    fn(c)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${client.fullName} details`}
        layoutId={reduce ? undefined : `client-card-${client.id}`}
        initial={reduce ? { opacity: 0, scale: 0.96 } : false}
        animate={reduce ? { opacity: 1, scale: 1 } : undefined}
        exit={reduce ? { opacity: 0, scale: 0.96 } : undefined}
        transition={{ duration: 0.2 }}
        className="relative z-10 my-auto w-full max-w-md"
      >
        <GlowCard>
          <ClientCardBody
            client={client}
            onRemove={after(onRemove)}
            onEdit={after(onEdit)}
            onCompleteJob={onCompleteJob ? after(onCompleteJob) : undefined}
            onInvoice={onInvoice ? after(onInvoice) : undefined}
          />
        </GlowCard>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-md transition hover:bg-slate-100 hover:text-slate-900 sm:-right-3 sm:-top-3"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  )
}

/** The full client card content — shared by the full-density list and the overlay. */
function ClientCardBody({ client, onRemove, onEdit, onCompleteJob, onInvoice }: { client: Client } & CardActions) {
  const isOneTime = client.serviceFrequency === 'one_time'
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-slate-900">{client.fullName}</h3>
          <a
            href={mapsUrl(client.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block break-words text-sm underline decoration-[var(--color-primary-light)] underline-offset-2 transition hover:opacity-80"
            style={{ color: `var(--color-primary-dark)` }}
          >
            {client.address}
          </a>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <IconButton label={`Edit ${client.fullName}`} onClick={() => onEdit(client)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          {onInvoice && (
            <IconButton label={`Invoice ${client.fullName}`} onClick={() => onInvoice(client)}>
              <FileText className="h-4 w-4" />
            </IconButton>
          )}
          {onCompleteJob && (
            <IconButton label={`Log job for ${client.fullName}`} onClick={() => onCompleteJob(client)}>
              <Check className="h-4 w-4" />
            </IconButton>
          )}
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
          <a href={telHref(client.phone)} className="flex min-w-0 items-center gap-2 underline decoration-[var(--color-primary-light)] underline-offset-2 transition hover:opacity-80" style={{ color: `var(--color-primary-dark)` }}>
            <Phone className="h-4 w-4 shrink-0" style={{ color: `var(--color-primary-dark)` }} />
            <span className="min-w-0 break-all">{client.phone}</span>
          </a>
        ) : (
          <InfoRow icon={Phone} text="Phone not on file" muted />
        )}
        {client.email ? (
          <a href={`mailto:${client.email}`} className="flex min-w-0 items-center gap-2 underline decoration-[var(--color-primary-light)] underline-offset-2 transition hover:opacity-80" style={{ color: `var(--color-primary-dark)` }}>
            <Mail className="h-4 w-4 shrink-0" style={{ color: `var(--color-primary-dark)` }} />
            <span className="min-w-0 break-all">{client.email}</span>
          </a>
        ) : (
          <InfoRow icon={Mail} text="Email not on file" muted />
        )}
        <InfoRow icon={CalendarClock} text={serviceFrequencyLabels[client.serviceFrequency]} />
        <InfoRow icon={Clock3} text={`${formatDuration(client.cutDurationMinutes)} per visit`} />
      </div>

      {client.notes ? (
        <p className="mt-4 rounded-xl border px-3 py-2 text-sm text-slate-800" style={{ borderColor: `var(--color-primary-light)`, backgroundColor: `var(--color-primary-light)` }}>
          {client.notes}
        </p>
      ) : null}

      <div className="mt-4 rounded-xl bg-slate-100/70 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Per visit</p>
            <p className="mt-1 text-base font-semibold text-slate-900 tabular">{formatCurrency(client.perCutRate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Expense / visit</p>
            <p className="mt-1 text-base font-semibold text-slate-900 tabular">{expenseDisplay(client)}</p>
          </div>
        </div>
        <div className="mt-2 border-t border-slate-200 pt-2">
          <p className="text-xs text-slate-500">
            {isOneTime ? (
              <>
                One-time ·{' '}
                <span className="font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
                  {formatCurrency(client.perCutRate - getExpensePerVisit(client))} net
                </span>
              </>
            ) : (
              <>
                Est. monthly: <span className="font-semibold text-slate-900">{formatCurrency(getMonthlyRevenue(client))}</span> · Net:{' '}
                <span className="font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>{formatCurrency(getMonthlyNet(client))}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-slate-500 transition"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `var(--color-primary-light)`
        e.currentTarget.style.color = `var(--color-primary-dark)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = ''
        e.currentTarget.style.color = ''
      }}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function InfoRow({ icon: Icon, text, muted }: { icon: typeof Phone; text: string; muted?: boolean }) {
  return (
    <p className={cn('flex min-w-0 items-center gap-2', muted && 'text-slate-500')}>
      <Icon className="h-4 w-4 shrink-0" style={{ color: `var(--color-primary-dark)` }} />
      <span className="min-w-0 break-words">{text}</span>
    </p>
  )
}
