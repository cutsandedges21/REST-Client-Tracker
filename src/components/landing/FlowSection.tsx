import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface FlowSectionProps {
  className?: string
  innerClassName?: string
  /** Applied to the outer <section> element so rotation reveals don't show through. */
  style?: CSSProperties
  children: ReactNode
  'aria-label'?: string
}

export function FlowSection({
  className,
  innerClassName,
  style,
  children,
  'aria-label': ariaLabel,
}: FlowSectionProps) {
  return (
    <section
      data-flow-section
      aria-label={ariaLabel}
      className={cn('relative min-h-screen w-full overflow-hidden', className)}
      style={style}
    >
      <div
        data-flow-inner
        className={cn(
          'flow-art-container relative flex min-h-screen w-full flex-col justify-center',
          'px-[4vw] py-[clamp(3rem,10vw,6rem)] will-change-transform',
          innerClassName,
        )}
        style={{ transformOrigin: 'bottom left' }}
      >
        {children}
      </div>
    </section>
  )
}
