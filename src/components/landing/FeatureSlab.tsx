import { motion } from 'framer-motion'

const LETTERS = ['R', 'E', 'S', 'T'] as const

export function FeatureSlab() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative w-full px-4 py-24 md:py-32"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <motion.span
          className="rounded-full border bg-white/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md dark:bg-white/10"
          style={{
            color: 'rgb(var(--color-primary-dark))',
            borderColor: 'rgb(var(--color-primary-dark), 0.4)',
          }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Everything you need
        </motion.span>

        <h2
          id="features-heading"
          className="flex flex-wrap items-end justify-center gap-2 text-5xl font-bold tracking-tighter md:text-7xl"
          aria-label="R-E-S-T. Four letters. One workflow."
        >
          {LETTERS.map((letter, i) => (
            <motion.span
              key={letter}
              aria-hidden
              className="inline-block"
              style={{ color: 'rgb(var(--color-primary-dark))' }}
              initial={{ opacity: 0, y: 30, rotate: -8 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{
                delay: i * 0.08,
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {letter}
              {i < LETTERS.length - 1 && (
                <span className="mx-1 opacity-40">·</span>
              )}
            </motion.span>
          ))}
        </h2>

        <motion.p
          className="max-w-2xl text-lg text-slate-600 dark:text-slate-400 md:text-xl"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          Four letters. One workflow. Built for business owners who'd rather be on the
          job than in front of a spreadsheet.
        </motion.p>
      </div>
    </section>
  )
}
