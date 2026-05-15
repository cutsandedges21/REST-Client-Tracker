import { Children, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotionSafe } from '../../hooks/useReducedMotionSafe'
import { cn } from '../../lib/utils'

gsap.registerPlugin(ScrollTrigger)

const DESKTOP_BREAKPOINT_PX = 768 // tailwind md

export interface FlowArtProps {
  children: ReactNode
  className?: string
  'aria-label'?: string
}

export function FlowArt({
  children,
  className,
  'aria-label': ariaLabel = 'Feature scroll',
}: FlowArtProps) {
  const containerRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotionSafe()
  const childCount = Children.count(children)

  useGSAP(
    () => {
      if (!containerRef.current || reducedMotion) return

      // Mobile: render as a plain stacked column, no pinning, no rotation.
      // Pinned + rotated transforms are unreliable on iOS Safari and the
      // sections look better as a normal scroll on small screens.
      const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`)
      if (!mq.matches) return

      const sections = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>('[data-flow-section]'),
      )
      if (sections.length === 0) return

      const triggers: ScrollTrigger[] = []

      sections.forEach((section, i) => {
        gsap.set(section, { zIndex: i + 1 })

        const inner = section.querySelector<HTMLElement>('.flow-art-container')
        if (!inner) return

        if (i > 0) {
          gsap.set(inner, { rotation: 30, transformOrigin: 'bottom left' })
          const tween = gsap.to(inner, {
            rotation: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'top 25%',
              scrub: true,
            },
          })
          if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
        }

        if (i < sections.length - 1) {
          triggers.push(
            ScrollTrigger.create({
              trigger: section,
              start: 'bottom bottom',
              end: 'bottom top',
              pin: true,
              pinSpacing: false,
            }),
          )
        }
      })

      ScrollTrigger.refresh()

      return () => {
        triggers.forEach((t) => t.kill())
      }
    },
    { scope: containerRef, dependencies: [childCount, reducedMotion] },
  )

  return (
    <main
      ref={containerRef}
      aria-label={ariaLabel}
      className={cn('w-full overflow-x-hidden', className)}
    >
      {children}
    </main>
  )
}
