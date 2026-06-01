import { useMemo, useState } from 'react'
import { AnimatePresence, Reorder, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin, Plus, Route as RouteIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { GlowCard } from '../components/GlowCard'
import { RouteStopCard } from '../components/RouteStopCard'
import { CompleteJobDialog, type CompleteJobInput } from '../components/CompleteJobDialog'
import type { Client } from '../types/client'
import type { CompletedJob } from '../types/completedJob'
import type { RouteStop } from '../types/route'
import { formatCurrency } from '../lib/finance'

interface RoutePageProps {
  clients: Client[]
  routeStops: RouteStop[]
  completedJobs: CompletedJob[]
  addRouteStop: (input: { clientId: string; date: string }) => Promise<{ ok: true } | { ok: false; reason: string }>
  removeRouteStop: (id: string) => Promise<void>
  reorderRouteStops: (date: string, orderedIds: string[]) => Promise<void>
  completeRouteStop: (stopId: string, job: Omit<CompletedJob, 'id' | 'username' | 'createdAt' | 'updatedAt'>) => Promise<void>
  reopenRouteStop: (stopId: string) => Promise<void>
  setJobPaid: (id: string, paid: boolean) => Promise<void>
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function shiftDate(key: string, days: number) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function dateLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = todayKey()
  if (key === today) return 'Today'
  if (key === shiftDate(today, 1)) return 'Tomorrow'
  if (key === shiftDate(today, -1)) return 'Yesterday'
  return date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function RoutePage({
  clients,
  routeStops,
  completedJobs,
  addRouteStop,
  removeRouteStop,
  reorderRouteStops,
  completeRouteStop,
  reopenRouteStop,
  setJobPaid,
}: RoutePageProps) {
  const [date, setDate] = useState(todayKey())
  const [adding, setAdding] = useState(false)
  const [loggingStop, setLoggingStop] = useState<RouteStop | null>(null)

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])
  const jobsById = useMemo(() => new Map(completedJobs.map((j) => [j.id, j])), [completedJobs])

  const dayStops = useMemo(
    () => routeStops.filter((s) => s.date === date).sort((a, b) => a.sortOrder - b.sortOrder),
    [routeStops, date],
  )

  const stopClientIds = useMemo(() => new Set(dayStops.map((s) => s.clientId)), [dayStops])
  const availableClients = useMemo(
    () =>
      clients
        .filter((c) => !stopClientIds.has(c.id))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [clients, stopClientIds],
  )

  const summary = useMemo(() => {
    let total = 0
    let owed = 0
    let done = 0
    for (const stop of dayStops) {
      const job = stop.completedJobId ? jobsById.get(stop.completedJobId) : undefined
      if (job) {
        total += job.earnings
        if (!job.paid) owed += job.earnings
        done += 1
      } else {
        total += clientsById.get(stop.clientId)?.perCutRate ?? 0
      }
    }
    return { total, owed, done }
  }, [dayStops, jobsById, clientsById])

  // Only money owed for visits that came from a route stop (any day) — not
  // historical jobs logged elsewhere — should show here.
  const routeJobIds = useMemo(
    () => new Set(routeStops.map((s) => s.completedJobId).filter((id): id is string => Boolean(id))),
    [routeStops],
  )
  const owedJobs = useMemo(
    () =>
      completedJobs
        .filter((j) => !j.paid && routeJobIds.has(j.id))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [completedJobs, routeJobIds],
  )
  const owedTotal = useMemo(() => owedJobs.reduce((sum, j) => sum + j.earnings, 0), [owedJobs])

  const handleAdd = async (clientId: string) => {
    const result = await addRouteStop({ clientId, date })
    if (!result.ok) toast.error((result as { ok: false; reason: string }).reason)
  }

  const handleSaveLog = async (job: CompleteJobInput) => {
    if (!loggingStop) return
    try {
      await completeRouteStop(loggingStop.id, job)
      toast.success(job.paid ? 'Visit logged & paid' : 'Visit logged — marked unpaid')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not log visit.')
    }
  }

  const handleMarkPaid = async (jobId: string) => {
    try {
      await setJobPaid(jobId, true)
      toast.success('Marked paid')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not mark paid.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header + date stepper */}
      <GlowCard>
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ backgroundColor: 'rgba(var(--color-primary-light), 0.9)', color: 'rgb(var(--color-primary-dark))' }}
              >
                <RouteIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold leading-tight" style={{ color: 'rgb(var(--color-primary-dark))' }}>
                  Route
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Plan your day, log visits & track who's paid.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setDate((d) => shiftDate(d, -1))}
              aria-label="Previous day"
              className="rounded-xl border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex flex-1 flex-col items-center">
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{dateLabel(date)}</span>
              <label className="relative cursor-pointer text-xs text-slate-500">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Pick a date"
                />
                <span className="underline-offset-2 hover:underline">{date}</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setDate((d) => shiftDate(d, 1))}
              aria-label="Next day"
              className="rounded-xl border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {date !== todayKey() && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setDate(todayKey())}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
              >
                Jump to today
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{dayStops.length}</span>{' '}
            {dayStops.length === 1 ? 'stop' : 'stops'}
            {summary.done > 0 && <> · {summary.done} done</>}
            {' · '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(summary.total)}</span>
            {summary.owed > 0 && <span className="text-amber-600 dark:text-amber-400"> · {formatCurrency(summary.owed)} owed</span>}
          </p>
        </div>
      </GlowCard>

      {/* Stops list */}
      {dayStops.length === 0 ? (
        <GlowCard>
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/10">
              <MapPin className="h-6 w-6" />
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {clients.length === 0
                ? 'Add some clients first, then build your route here.'
                : 'No stops yet. Add the clients you’ll visit today.'}
            </p>
          </div>
        </GlowCard>
      ) : (
        <Reorder.Group
          axis="y"
          values={dayStops}
          onReorder={(next) => void reorderRouteStops(date, next.map((s) => s.id))}
          className="flex flex-col gap-2.5"
        >
          {dayStops.map((stop, index) => {
            const job = stop.completedJobId ? jobsById.get(stop.completedJobId) : undefined
            return (
              <RouteStopCard
                key={stop.id}
                stop={stop}
                position={index + 1}
                client={clientsById.get(stop.clientId)}
                job={job}
                onLog={() => setLoggingStop(stop)}
                onReopen={() => void reopenRouteStop(stop.id)}
                onRemove={() => void removeRouteStop(stop.id)}
                onMarkPaid={() => job && void handleMarkPaid(job.id)}
              />
            )
          })}
        </Reorder.Group>
      )}

      {/* Add stop */}
      {availableClients.length > 0 && (
        <div>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] dark:border-white/15 dark:text-slate-300"
            >
              <Plus className="h-4 w-4" />
              Add stop
            </button>
          ) : (
            <GlowCard>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add a stop</p>
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    aria-label="Close"
                    className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                  {availableClients.map((client) => (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={() => void handleAdd(client.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-[var(--color-primary)] dark:border-white/10 dark:bg-[#18181b]"
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold"
                          style={{ backgroundColor: 'rgba(var(--color-primary-light), 0.9)', color: 'rgb(var(--color-primary-dark))' }}
                        >
                          <Plus className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">{client.fullName}</span>
                          {client.address?.trim() && (
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{client.address}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-slate-600 dark:text-slate-300">{formatCurrency(client.perCutRate)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </GlowCard>
          )}
        </div>
      )}

      {/* Owed (unpaid) across all days */}
      {owedJobs.length > 0 && (
        <GlowCard>
          <div className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg font-semibold" style={{ color: 'rgb(var(--color-primary-dark))' }}>
                Owed
              </h3>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(owedTotal)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Visits logged but not yet paid — tap “Paid” once you collect.
            </p>
            <ul className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {owedJobs.map((job) => (
                  <motion.li
                    key={job.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{job.clientName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{job.date}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(job.earnings)}</span>
                        <button
                          type="button"
                          onClick={() => void handleMarkPaid(job.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98]"
                          style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                        >
                          Paid
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </GlowCard>
      )}

      <CompleteJobDialog
        open={Boolean(loggingStop)}
        onClose={() => setLoggingStop(null)}
        onSave={handleSaveLog}
        clients={clients}
        preselectedClientId={loggingStop?.clientId}
      />
    </div>
  )
}
