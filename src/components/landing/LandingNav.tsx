import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { RestMark } from '../RestMark'

export function LandingNav() {
  const { scrollY } = useScroll()
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const blur = useTransform(scrollY, [0, 80], [0, 12])
  const backdropFilter = useTransform(blur, (v) => `blur(${v}px)`)
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.6])

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 transition-colors"
        style={{ opacity: bgOpacity, backdropFilter, WebkitBackdropFilter: backdropFilter }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          opacity: borderOpacity,
          background: 'rgba(var(--color-primary-dark), 0.25)',
        }}
      />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 md:px-8 md:py-3">
        <Link to="/" aria-label="REST home" className="block">
          <RestMark size="sm" />
        </Link>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link
            to="/login"
            className="rounded-full px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:text-slate-900 sm:px-3 sm:text-sm dark:text-slate-300 dark:hover:text-white"
          >
            Sign in
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/signup"
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition sm:px-4 sm:py-2 sm:text-sm"
              style={{
                background:
                  'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)',
                boxShadow: '0 6px 20px -8px rgb(var(--color-primary-dark), 0.6)',
              }}
            >
              Get started
              <motion.span
                className="inline-flex"
                initial={false}
                animate={{ x: 0 }}
                whileHover={{ x: 3 }}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.span>
            </Link>
          </motion.div>
        </nav>
      </div>
    </motion.header>
  )
}
