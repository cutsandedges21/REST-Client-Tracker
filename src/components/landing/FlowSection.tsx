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
      className={cn(
        'relative w-full overflow-hidden',
        // Mobile: each section sizes to its content with comfortable padding.
        // Desktop: full viewport for the GSAP pin/rotate animation.
        'min-h-fit md:min-h-screen',
        className,
      )}
      style={style}
    >
      <div
        data-flow-inner
        className={cn(
          'flow-art-container relative flex w-full flex-col justify-center',
          'min-h-fit md:min-h-screen',
          'px-6 py-16 sm:px-8 md:px-[4vw] md:py-[clamp(3rem,10vw,6rem)]',
          'will-change-transform',
          innerClassName,
        )}
        style={{ transformOrigin: 'bottom left' }}
      >
        {children}
      </div>
    </section>
  )
}
