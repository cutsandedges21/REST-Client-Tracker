import { Reorder, useDragControls } from 'framer-motion'
import { Check, GripVertical, MapPin, RotateCcw, Trash2 } from 'lucide-react'
import type { Client } from '../types/client'
import type { CompletedJob } from '../types/completedJob'
import type { RouteStop } from '../types/route'
import { formatCurrency } from '../lib/finance'
import { paymentMethodLabels } from '../lib/labels'
import { directionsUrl } from '../lib/maps'

interface RouteStopCardProps {
  stop: RouteStop
  position: number
  client?: Client
  job?: CompletedJob
  onLog: () => void
  onReopen: () => void
  onRemove: () => void
  onMarkPaid: () => void
}

export function RouteStopCard({
  stop,
  position,
  client,
  job,
  onLog,
  onReopen,
  onRemove,
  onMarkPaid,
}: RouteStopCardProps) {
  const dragControls = useDragControls()
  const done = Boolean(job)
  const paid = job?.paid ?? false
  const name = client?.fullName ?? 'Unknown client'
  const address = client?.address?.trim() ?? ''
  const amount = job?.earnings ?? client?.perCutRate ?? 0
  const mapsHref = directionsUrl(address)

  return (
    <Reorder.Item
      value={stop}
      dragListener={false}
      dragControls={dragControls}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#18181b]"
    >
      <div className="flex items-start gap-2 p-3.5">
        {/* Drag handle */}
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => dragControls.start(e)}
          className="mt-0.5 cursor-grab touch-none rounded-lg p-1 text-slate-300 transition hover:text-slate-500 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Position badge */}
        <span
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold"
          style={{
            backgroundColor: done ? 'rgba(var(--color-primary-light), 0.9)' : 'rgb(241 245 249)',
            color: done ? 'rgb(var(--color-primary-dark))' : '#64748b',
          }}
        >
          {position}
        </span>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate font-semibold ${done ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}
            >
              {name}
            </p>
            <span className="ml-auto shrink-0 tabular-nums text-sm font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(amount)}
            </span>
          </div>

          {address ? (
            mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-[var(--color-primary)] dark:text-slate-400"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{address}</span>
              </a>
            ) : (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{address}</p>
            )
          ) : (
            <p className="mt-0.5 text-xs italic text-slate-400">No address on file</p>
          )}

          {/* Status row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {!done ? (
              <button
                type="button"
                onClick={onLog}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98]"
                style={{ backgroundColor: 'rgb(var(--color-primary))' }}
              >
                <Check className="h-3.5 w-3.5" />
                Log visit
              </button>
            ) : (
              <>
                {paid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    Paid{job?.paymentMethod ? ` · ${paymentMethodLabels[job.paymentMethod]}` : ''}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onMarkPaid}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300"
                  >
                    ● Unpaid — mark paid
                  </button>
                )}
                <button
                  type="button"
                  onClick={onReopen}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Undo
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove stop"
              className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Reorder.Item>
  )
}
