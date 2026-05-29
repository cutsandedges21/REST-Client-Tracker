import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { primaryButtonClass, primaryButtonStyle } from '../lib/ui'

export interface TourStep {
  /** value of a `data-tour` attribute to highlight; null = centered welcome card */
  selector: string | null
  title: string
  body: string
  /** run when the step becomes active (e.g. switch tabs so the target is visible) */
  onEnter?: () => void
  /** label for the primary button on the final step (defaults to "Done") */
  cta?: string
  /** action for the final-step primary button (runs, then the tour finishes) */
  onCta?: () => void
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 8

export function OnboardingTour({ steps, onFinish }: { steps: TourStep[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const scrolledFor = useRef<number>(-1)
  const step = steps[index]
  const isLast = index === steps.length - 1

  // Side effects (tab/view switches) when entering a step.
  useEffect(() => {
    scrolledFor.current = -1
    step.onEnter?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Keep the highlight glued to its target (handles late mount + tab animations).
  useEffect(() => {
    if (!step.selector) {
      setRect(null)
      return
    }
    let raf = 0
    const tick = () => {
      const el = document.querySelector(`[data-tour="${step.selector}"]`)
      if (el) {
        if (scrolledFor.current !== index) {
          const r0 = el.getBoundingClientRect()
          if (r0.top < 80 || r0.bottom > window.innerHeight - 80) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }
          scrolledFor.current = index
        }
        const r = el.getBoundingClientRect()
        setRect((prev) => {
          if (
            prev &&
            Math.abs(prev.top - r.top) < 0.5 &&
            Math.abs(prev.left - r.left) < 0.5 &&
            Math.abs(prev.width - r.width) < 0.5 &&
            Math.abs(prev.height - r.height) < 0.5
          ) {
            return prev
          }
          return { top: r.top, left: r.left, width: r.width, height: r.height }
        })
      } else {
        setRect(null)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step.selector, index])

  const finish = () => onFinish()
  const next = () => (isLast ? finish() : setIndex((i) => i + 1))
  const back = () => setIndex((i) => Math.max(0, i - 1))
  const handlePrimary = () => {
    if (isLast) {
      step.onCta?.()
      finish()
    } else {
      next()
    }
  }

  const hole = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  // Card is pinned to the top or bottom edge (whichever is away from the hole),
  // centred horizontally and height-capped — so it can never run off-screen.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const cardW = Math.min(380, vw - 24)
  let posStyle: CSSProperties = { width: cardW, maxHeight: 'calc(100dvh - 2rem)' }
  let centerClass = 'left-1/2 -translate-x-1/2'
  if (!hole) {
    posStyle = { ...posStyle, top: '50%' }
    centerClass = 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
  } else if (hole.top + hole.height / 2 > vh * 0.5) {
    posStyle = { ...posStyle, top: 16 }
  } else {
    posStyle = { ...posStyle, bottom: 16 }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* click blocker */}
      <div className="absolute inset-0" />

      {hole ? (
        <motion.div
          className="pointer-events-none absolute rounded-2xl"
          initial={false}
          animate={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          style={{
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.72)',
            outline: '2px solid rgb(var(--color-primary))',
            outlineOffset: 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/75" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className={`absolute ${centerClass} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10`}
          style={posStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgb(var(--color-primary))' }}>
            Step {index + 1} of {steps.length}
          </p>
          <h3 className="mt-1.5 font-display text-xl font-semibold text-slate-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button type="button" onClick={finish} className="text-sm font-medium text-slate-400 hover:text-slate-600">
              Skip
            </button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Back
                </button>
              )}
              <button type="button" onClick={handlePrimary} className={`${primaryButtonClass} px-4 py-2`} style={primaryButtonStyle}>
                {isLast ? step.cta ?? 'Done' : 'Next'}
              </button>
            </div>
          </div>

          {/* progress dots */}
          <div className="mt-4 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === index ? 18 : 6,
                  backgroundColor: i === index ? 'rgb(var(--color-primary))' : 'rgb(203, 213, 225)',
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  )
}
