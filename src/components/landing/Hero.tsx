import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, MoveRight } from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
}

export function Hero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ['clients', 'jobs', 'revenue', 'invoices', 'reminders'],
    [],
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((n) => (n === titles.length - 1 ? 0 : n + 1))
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  return (
    <section className="relative w-full pt-16 sm:pt-20 md:pt-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          className="flex flex-col items-center justify-center gap-5 py-6 sm:gap-7 sm:py-8 md:py-12"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            variants={itemVariants}
            className="max-w-3xl text-center text-3xl font-medium tracking-tighter sm:text-5xl md:text-7xl"
          >
            <span style={{ color: 'rgb(var(--color-primary-dark))' }}>
              The smarter way to manage
            </span>
            <span className="relative flex w-full justify-center overflow-hidden text-center pt-1 pb-2 md:pb-4">
              &nbsp;
              {titles.map((title, index) => (
                <motion.span
                  key={title}
                  className="absolute font-bold"
                  style={{ color: 'rgb(var(--color-primary))' }}
                  initial={{ opacity: 0, y: -120 }}
                  transition={{ type: 'spring', stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : {
                        y: titleNumber > index ? -150 : 150,
                        opacity: 0,
                      }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-2xl text-center text-base leading-relaxed tracking-tight text-slate-600 dark:text-slate-300 sm:text-lg md:text-xl"
          >
            REST is the all-in-one client tracker for solo trades. Track every job, schedule
            every client, send every reminder, and watch your revenue grow, all without the
            spreadsheet chaos.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white/30 px-6 py-3 text-sm font-semibold shadow-sm backdrop-blur-md transition hover:bg-white/50 dark:bg-white/10 dark:hover:bg-white/20"
                style={{
                  borderColor: 'rgb(var(--color-primary-dark), 0.4)',
                  color: 'rgb(var(--color-primary-dark))',
                }}
              >
                See how it works
                <MoveRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)',
                  boxShadow: '0 12px 30px -10px rgb(var(--color-primary-dark), 0.65)',
                }}
              >
                Get started free
                <motion.span
                  className="inline-flex"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 3 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            Manage your clients with ease · Free forever for up to 3 clients
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
