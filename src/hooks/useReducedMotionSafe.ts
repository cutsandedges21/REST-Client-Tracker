import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Returns true when the user prefers reduced motion.
 * Combines Framer Motion's built-in detection with a matchMedia listener so
 * GSAP-driven sections see the same value.
 */
export function useReducedMotionSafe(): boolean {
  const fmPrefers = useReducedMotion()
  const [mqPrefers, setMqPrefers] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMqPrefers(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return Boolean(fmPrefers) || mqPrefers
}
