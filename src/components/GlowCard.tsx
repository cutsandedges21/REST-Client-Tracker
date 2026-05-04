import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useCallback, useRef } from 'react'
import { cn } from '../lib/utils'

type GlowCardProps = {
  children: ReactNode
  className?: string
  /** Extra classes on the inner content wrapper (background) */
  innerClassName?: string
}

/**
 * Border glow follows pointer (mouse or touch via Pointer Events — works on modern iPhone).
 */
export function GlowCard({ children, className, innerClassName }: GlowCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const updateGlow = useCallback((clientX: number, clientY: number) => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((clientX - r.left) / r.width) * 100
    const y = ((clientY - r.top) / r.height) * 100
    el.style.setProperty('--glow-x', `${Math.max(0, Math.min(100, x))}%`)
    el.style.setProperty('--glow-y', `${Math.max(0, Math.min(100, y))}%`)
  }, [])

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    updateGlow(e.clientX, e.clientY)
  }

  const onPointerLeave = () => {
    const el = rootRef.current
    if (!el) return
    el.style.setProperty('--glow-x', '50%')
    el.style.setProperty('--glow-y', '50%')
  }

  return (
    <div
      ref={rootRef}
      className={cn('glow-border-root rounded-2xl p-px', className)}
      style={{ '--glow-x': '50%', '--glow-y': '50%' } as CSSProperties}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerMove}
    >
      <div className={cn('glow-border-inner h-full rounded-[0.9375rem]', innerClassName)}>{children}</div>
    </div>
  )
}
