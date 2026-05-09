import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { UserPlus, CalendarClock, DollarSign } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Add your clients',
    body: 'Drop in name, address, rate, and how often you visit. REST normalizes the math.',
    icon: UserPlus,
  },
  {
    number: '02',
    title: 'Schedule the work',
    body: 'REST handles recurrence, conflicts, and reminders so the calendar plans itself.',
    icon: CalendarClock,
  },
  {
    number: '03',
    title: 'Get paid, see it work',
    body: 'Complete jobs in one tap. Watch profit, hours, and expenses roll into a live dashboard.',
    icon: DollarSign,
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const numberY = useTransform(scrollYProgress, [0, 1], [30, -30])

  return (
    <section
      ref={ref}
      id="how"
      aria-labelledby="how-heading"
      className="relative w-full px-4 py-28 md:py-36"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14">
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <motion.span
            className="rounded-full border bg-white/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md dark:bg-white/10"
            style={{
              color: 'rgb(var(--color-primary-dark))',
              borderColor: 'rgb(var(--color-primary-dark), 0.4)',
            }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.5 }}
          >
            How it works
          </motion.span>
          <motion.h2
            id="how-heading"
            className="text-4xl font-bold tracking-tighter md:text-6xl"
            style={{ color: 'rgb(var(--color-primary-dark))' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Three steps from chaos to control.
          </motion.h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <motion.span
                className="text-6xl font-black tracking-tighter"
                style={{
                  color: 'rgb(var(--color-primary-dark), 0.18)',
                  y: numberY,
                }}
              >
                {step.number}
              </motion.span>
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)',
                  color: 'white',
                  boxShadow: '0 10px 30px -12px rgb(var(--color-primary-dark), 0.7)',
                }}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
