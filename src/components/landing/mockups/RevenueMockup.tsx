import { memo, useEffect, useRef, useState } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useReducedMotionSafe } from '../../../hooks/useReducedMotionSafe'

const BAR_HEIGHTS_SETS: number[][] = [
  [42, 58, 51, 70, 64, 88],
  [38, 50, 62, 55, 78, 92],
  [45, 60, 54, 72, 80, 95],
  [40, 56, 65, 60, 74, 89],
]

const TARGET_TOTALS = [3247, 3580, 3892, 4124]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

export const RevenueMockup = memo(function RevenueMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px', once: false })
  const reducedMotion = useReducedMotionSafe()
  const [setIndex, setSetIndex] = useState(0)
  const totalMv = useMotionValue(reducedMotion ? TARGET_TOTALS[0] : 0)
  const [displayTotal, setDisplayTotal] = useState(reducedMotion ? TARGET_TOTALS[0] : 0)

  useEffect(() => {
    return totalMv.on('change', (v) => setDisplayTotal(Math.round(v)))
  }, [totalMv])

  useEffect(() => {
    if (reducedMotion) return
    if (!inView) return
    const target = TARGET_TOTALS[setIndex]
    const controls = animate(totalMv, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
    })
    const timer = setTimeout(() => {
      setSetIndex((n) => (n + 1) % BAR_HEIGHTS_SETS.length)
    }, 5000)
    return () => {
      controls.stop()
      clearTimeout(timer)
    }
  }, [setIndex, inView, reducedMotion, totalMv])

  const heights = BAR_HEIGHTS_SETS[setIndex]

  return (
    <div
      ref={ref}
      className="relative w-full max-w-sm rounded-2xl border border-white/30 bg-white/80 p-5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)] backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/70"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Monthly profit
          </p>
          <p
            className="mt-1 text-3xl font-bold tabular-nums tracking-tight"
            style={{ color: 'rgb(var(--color-primary-dark))' }}
          >
            ${displayTotal.toLocaleString()}
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            backgroundColor: 'rgb(var(--color-primary), 0.12)',
            color: 'rgb(var(--color-primary-dark))',
          }}
        >
          <TrendingUp className="h-3 w-3" />
          +12.4%
        </div>
      </div>

      <div className="flex h-32 items-end gap-2">
        {heights.map((h, i) => (
          <BarColumn key={`${setIndex}-${i}`} height={h} delay={i * 0.07} mv={totalMv} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">
        {MONTHS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  )
})

function BarColumn({
  height,
  delay,
  mv,
}: {
  height: number
  delay: number
  mv: MotionValue<number>
}) {
  return (
    <motion.div
      className="flex-1 rounded-t-md"
      style={{
        background:
          'linear-gradient(180deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)',
        transformOrigin: 'bottom',
        height: `${height}%`,
        // bind to mv so any change re-renders bars consistently — purely cosmetic
        opacity: mv ? 1 : 1,
      }}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}
