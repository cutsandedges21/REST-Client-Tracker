import { memo, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Check, Mail } from 'lucide-react'
import { useReducedMotionSafe } from '../../../hooks/useReducedMotionSafe'

type Phase = 'idle' | 'card' | 'sent'

export const EmailMockup = memo(function EmailMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reducedMotion = useReducedMotionSafe()
  const [phase, setPhase] = useState<Phase>(reducedMotion ? 'sent' : 'idle')

  useEffect(() => {
    if (reducedMotion) {
      setPhase('sent')
      return
    }
    if (!inView) {
      setPhase('idle')
      return
    }
    let cancelled = false
    const run = () => {
      if (cancelled) return
      setPhase('idle')
      const t1 = setTimeout(() => !cancelled && setPhase('card'), 400)
      const t2 = setTimeout(() => !cancelled && setPhase('sent'), 1900)
      const t3 = setTimeout(() => !cancelled && run(), 5400)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
    const cleanup = run()
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [inView, reducedMotion])

  return (
    <div ref={ref} className="relative flex w-full justify-center">
      <div
        className="relative h-[340px] w-[200px] rounded-[36px] border-[6px] border-zinc-900 bg-zinc-50 p-3 shadow-2xl dark:bg-zinc-800"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.4)' }}
      >
        <div className="absolute left-1/2 top-1.5 h-1.5 w-16 -translate-x-1/2 rounded-full bg-zinc-900" />

        <div className="flex h-full flex-col gap-2 pt-3">
          <div className="flex items-center justify-between px-1 text-[9px] font-semibold text-slate-500">
            <span>9:41</span>
            <span>REST</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <AnimatePresence>
              {(phase === 'card' || phase === 'sent') && (
                <motion.div
                  key="card"
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                  className="rounded-2xl bg-white p-3 shadow-md dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="grid h-8 w-8 place-items-center rounded-full"
                      style={{
                        backgroundColor: 'rgb(var(--color-primary), 0.15)',
                        color: 'rgb(var(--color-primary-dark))',
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold text-slate-900 dark:text-slate-100">
                        Reminder · Tomorrow
                      </p>
                      <p className="truncate text-[9px] text-slate-500">
                        Sarah's lawn — 9:00 AM
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[9px] leading-snug text-slate-600 dark:text-slate-400">
                    Hi Sarah! Just a quick reminder we'll be by tomorrow at 9 AM. Reply if
                    anything's changed.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {phase === 'sent' && (
              <motion.div
                key="sent"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-bold text-white shadow-md"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
                Sent
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
})
