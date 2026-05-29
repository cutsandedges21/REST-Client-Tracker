import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe'

const LETTERS = [
  { letter: 'R', word: 'Revenue' },
  { letter: 'E', word: 'Email' },
  { letter: 'S', word: 'Schedule' },
  { letter: 'T', word: 'Track' },
] as const

interface IntroAnimationProps {
  onDone: () => void
}

/**
 * Brief brand intro: "REST" assembles letter-by-letter, each letter reveals the
 * word it stands for, then the whole thing lifts away to expose the login page.
 * Tap anywhere to skip. Honours reduced-motion.
 */
export function IntroAnimation({ onDone }: IntroAnimationProps) {
  const reduce = useReducedMotionSafe()

  useEffect(() => {
    const timer = setTimeout(onDone, reduce ? 600 : 3000)
    return () => clearTimeout(timer)
  }, [onDone, reduce])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-white px-6 dark:bg-[#09090b]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
      onClick={onDone}
      role="button"
      aria-label="Skip intro"
    >
      {/* Theme glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(var(--color-primary), 0.18) 0%, transparent 70%)' }}
      />

      <motion.div
        className="relative flex items-end"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: reduce ? 0 : 0.14, delayChildren: 0.1 } },
        }}
      >
        {LETTERS.map((item, i) => (
          <motion.div
            key={item.letter}
            className="relative flex flex-col items-center px-3 sm:px-5"
            style={i < LETTERS.length - 1 ? { borderRight: '1px solid rgb(var(--color-primary-dark))' } : undefined}
            variants={{
              hidden: { opacity: 0, y: 26, rotate: -8 },
              show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <span
              className="font-display text-7xl font-bold leading-none sm:text-8xl"
              style={{
                color: 'rgb(var(--color-primary-dark))',
                textShadow: '0 0 50px rgba(var(--color-primary-dark), 0.35)',
              }}
            >
              {item.letter}
            </span>
            <motion.span
              className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]"
              style={{ color: 'rgb(var(--color-primary-dark))' }}
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: { opacity: 1, y: 0, transition: { delay: reduce ? 0 : 0.7, duration: 0.4 } },
              }}
            >
              {item.word}
            </motion.span>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="mt-10 text-sm text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: reduce ? 0.1 : 1.4, duration: 0.5 } }}
      >
        Everything your service business needs.
      </motion.p>
    </motion.div>
  )
}
