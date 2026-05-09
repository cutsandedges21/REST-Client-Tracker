import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Search, MapPin, Phone } from 'lucide-react'
import { useReducedMotionSafe } from '../../../hooks/useReducedMotionSafe'

type Client = {
  id: string
  name: string
  area: string
  phone: string
  rate: string
  freq: string
}

const ALL_CLIENTS: Client[] = [
  {
    id: 'sarah',
    name: 'Sarah Lopez',
    area: 'Maple Street',
    phone: '555-0142',
    rate: '$85',
    freq: 'Weekly',
  },
  {
    id: 'mike',
    name: 'Mike Brown',
    area: 'Oak Avenue',
    phone: '555-0117',
    rate: '$120',
    freq: 'Bi-weekly',
  },
  {
    id: 'jen',
    name: 'Jen Patel',
    area: 'Pine Court',
    phone: '555-0298',
    rate: '$75',
    freq: 'Weekly',
  },
]

const QUERIES = ['', 'sa', 'sar', 'sara', '']
const QUERY_HOLD_MS = 1100
const QUERY_STEP_MS = 220

export const TrackMockup = memo(function TrackMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reducedMotion = useReducedMotionSafe()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (reducedMotion || !inView) return
    let cancelled = false
    let queryIdx = 0
    let typedIdx = 0
    let timer: ReturnType<typeof setTimeout>

    const step = () => {
      if (cancelled) return
      const target = QUERIES[queryIdx]
      if (typedIdx <= target.length) {
        setQuery(target.slice(0, typedIdx))
        typedIdx += 1
        timer = setTimeout(step, QUERY_STEP_MS)
      } else {
        timer = setTimeout(() => {
          queryIdx = (queryIdx + 1) % QUERIES.length
          typedIdx = 0
          step()
        }, QUERY_HOLD_MS)
      }
    }
    step()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [inView, reducedMotion])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_CLIENTS
    return ALL_CLIENTS.filter((c) => c.name.toLowerCase().includes(q))
  }, [query])

  return (
    <div
      ref={ref}
      className="relative w-full max-w-sm rounded-2xl border border-white/30 bg-white/80 p-4 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)] backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/70"
    >
      <div
        className="mb-3 flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2 dark:bg-zinc-800"
        style={{ borderColor: 'rgb(var(--color-primary), 0.25)' }}
      >
        <Search className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {query || 'Search clients'}
          {!reducedMotion && (
            <motion.span
              className="ml-0.5 inline-block w-[1px] bg-slate-700 dark:bg-slate-300"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              style={{ height: '0.85em', verticalAlign: 'middle' }}
            />
          )}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((client) => (
            <motion.div
              key={client.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 26,
              }}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                    {client.name}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {client.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: 'rgb(var(--color-primary-dark))' }}
                  >
                    {client.rate}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">
                    {client.freq}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400">No matches</p>
        )}
      </div>
    </div>
  )
})
