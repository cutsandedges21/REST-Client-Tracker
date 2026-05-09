import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useReducedMotionSafe } from '../../../hooks/useReducedMotionSafe'

type Chip = { id: string; day: number; row: number; label: string; color: 'a' | 'b' | 'c' }

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const BASE_CHIPS: Chip[] = [
  { id: 'c1', day: 0, row: 0, label: 'Sarah · 9:00', color: 'a' },
  { id: 'c2', day: 0, row: 1, label: 'Mike · 11:30', color: 'b' },
  { id: 'c3', day: 1, row: 0, label: 'Lopez · 8:00', color: 'a' },
  { id: 'c4', day: 2, row: 0, label: 'Brown · 10:00', color: 'c' },
  { id: 'c5', day: 2, row: 1, label: 'Wong · 1:00', color: 'b' },
  { id: 'c6', day: 3, row: 0, label: 'Smith · 9:30', color: 'a' },
  { id: 'c7', day: 4, row: 0, label: 'Cole · 8:00', color: 'c' },
  { id: 'c8', day: 4, row: 1, label: 'Patel · 11:00', color: 'b' },
  { id: 'c9', day: 5, row: 0, label: 'Reyes · 10:30', color: 'a' },
]

const COLOR_STYLES: Record<Chip['color'], { bg: string; text: string }> = {
  a: { bg: 'rgb(var(--color-primary), 0.18)', text: 'rgb(var(--color-primary-dark))' },
  b: { bg: 'rgba(16, 185, 129, 0.18)', text: 'rgb(4, 120, 87)' },
  c: { bg: 'rgba(244, 114, 182, 0.18)', text: 'rgb(190, 24, 93)' },
}

const DRAGGED_ID = 'c5'

export const ScheduleMockup = memo(function ScheduleMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reducedMotion = useReducedMotionSafe()
  const [draggedDayOffset, setDraggedDayOffset] = useState(0)
  const [revealKey, setRevealKey] = useState(0)

  useEffect(() => {
    if (reducedMotion || !inView) return
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      setRevealKey((k) => k + 1)
      const dragForward = setTimeout(() => !cancelled && setDraggedDayOffset(1), 1500)
      const dragBack = setTimeout(() => !cancelled && setDraggedDayOffset(0), 3200)
      const restart = setTimeout(() => !cancelled && tick(), 6500)
      return () => {
        clearTimeout(dragForward)
        clearTimeout(dragBack)
        clearTimeout(restart)
      }
    }
    const cleanup = tick()
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [inView, reducedMotion])

  const chips = useMemo(() => BASE_CHIPS, [])

  return (
    <div
      ref={ref}
      className="relative w-full max-w-md rounded-2xl border border-white/30 bg-white/80 p-4 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)] backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/70"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          This week
        </p>
        <p
          className="text-xs font-bold"
          style={{ color: 'rgb(var(--color-primary-dark))' }}
        >
          May 4–10
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="relative mt-2 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, dayIdx) => (
          <div
            key={dayIdx}
            className="relative h-24 rounded-lg bg-slate-100/70 dark:bg-zinc-800/70"
          />
        ))}

        <div className="pointer-events-none absolute inset-0 grid grid-cols-7 gap-1.5">
          {chips.map((chip, i) => {
            const isDragged = chip.id === DRAGGED_ID
            const targetDay = chip.day + (isDragged ? draggedDayOffset : 0)
            const colors = COLOR_STYLES[chip.color]
            return (
              <motion.div
                key={`${revealKey}-${chip.id}`}
                className="absolute h-7 rounded-md px-1.5 py-0.5 text-[8px] font-semibold leading-tight shadow-sm"
                style={{
                  background: colors.bg,
                  color: colors.text,
                  width: 'calc((100% - 6 * 0.375rem) / 7)',
                  left: `calc(${targetDay} * (100% - 6 * 0.375rem) / 7 + ${targetDay} * 0.375rem)`,
                  top: `calc(${chip.row} * (1.75rem + 0.25rem))`,
                }}
                initial={reducedMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: reducedMotion ? 0 : i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                  left: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                }}
              >
                <span className="block truncate">{chip.label}</span>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>9 jobs · 14 hrs</span>
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold"
          style={{
            backgroundColor: 'rgb(var(--color-primary), 0.12)',
            color: 'rgb(var(--color-primary-dark))',
          }}
        >
          0 conflicts
        </span>
      </div>
    </div>
  )
})
