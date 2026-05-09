import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative w-full overflow-hidden px-4 py-32 md:py-40"
    >
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--color-primary), 0.35) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-20% 0px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2
          id="cta-heading"
          className="text-4xl font-bold tracking-tighter md:text-7xl"
          style={{ color: 'rgb(var(--color-primary-dark))' }}
        >
          Stop tracking clients on paper.
        </h2>
        <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400 md:text-xl">
          Build your business on a real workflow. REST is free to start, no credit card,
          no risk.
        </p>

        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link
            to="/signup"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-base font-semibold text-white shadow-2xl transition"
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 50%, rgb(var(--color-primary)) 100%)',
              backgroundSize: '200% 100%',
              boxShadow: '0 18px 40px -12px rgb(var(--color-primary-dark), 0.7)',
            }}
          >
            <motion.span
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 50%, rgb(var(--color-primary)) 100%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <span className="relative">Get started free</span>
            <motion.span
              className="relative inline-flex"
              initial={false}
              animate={{ x: 0 }}
              whileHover={{ x: 4 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
          </Link>
        </motion.div>

        <p className="text-xs text-slate-500">
          No credit card required · Free forever for up to 3 clients
        </p>
      </motion.div>
    </section>
  )
}
