import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe'

/**
 * Wraps the matched child route in an AnimatePresence with a soft fade/slide.
 * Used by RootLayout in router.tsx.
 */
export function RouteTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const reducedMotion = useReducedMotionSafe()

  if (reducedMotion) {
    return outlet
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
