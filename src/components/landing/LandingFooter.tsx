import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RestMark } from '../RestMark'

export function LandingFooter() {
  const year = new Date().getFullYear()
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.5 }}
      className="relative w-full border-t border-slate-200/60 bg-white/40 px-4 py-10 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/40"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <RestMark size="xs" />
          <span className="text-xs text-slate-500 dark:text-slate-500">
            © {year} REST. All rights reserved.
          </span>
        </div>
        <nav className="flex items-center gap-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
          <Link to="/login" className="transition hover:text-slate-900 dark:hover:text-white">
            Sign in
          </Link>
          <a href="#pricing" className="transition hover:text-slate-900 dark:hover:text-white">
            Pricing
          </a>
          <a
            href="mailto:hello@rest-app.local"
            className="transition hover:text-slate-900 dark:hover:text-white"
          >
            Contact
          </a>
        </nav>
      </div>
    </motion.footer>
  )
}
