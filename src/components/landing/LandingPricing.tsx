import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { GlowCard } from '../GlowCard'
import { PLANS, type Plan } from '../../lib/plans'

export function LandingPricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
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
            Pricing
          </motion.span>
          <motion.h2
            id="pricing-heading"
            className="text-4xl font-bold tracking-tighter md:text-6xl"
            style={{ color: 'rgb(var(--color-primary-dark))' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.6 }}
          >
            Start free. Scale when you're ready.
          </motion.h2>
          <motion.p
            className="text-base text-slate-600 dark:text-slate-400 md:text-lg"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            Switch plans any time. No contracts, no surprises.
          </motion.p>
        </div>

        <div className="grid w-full gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <motion.div
      className="relative h-full"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      {plan.highlight && (
        <motion.div
          className="absolute -top-3 right-4 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-md"
          style={{ backgroundColor: 'rgb(var(--color-primary-dark))' }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgb(var(--color-primary), 0.6)',
              '0 0 0 8px rgb(var(--color-primary), 0)',
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, repeatType: 'loop' }}
        >
          <Sparkles className="h-3 w-3" />
          Most Popular
        </motion.div>
      )}
      <GlowCard className="h-full">
        <div
          className={`flex h-full flex-col p-5 md:p-6 ${
            plan.highlight ? 'ring-2 ring-[rgb(var(--color-primary))]' : ''
          } rounded-2xl`}
        >
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-lg font-semibold tracking-tight"
              style={{ color: 'rgb(var(--color-primary-dark))' }}
            >
              {plan.name}
            </h3>
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {plan.priceLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{plan.tagline}</p>

          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {plan.benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: 'rgb(var(--color-primary))' }}
                />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Link
              to={`/signup?plan=${plan.id}`}
              className="block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white transition"
              style={{
                background: plan.highlight
                  ? 'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)'
                  : 'rgb(var(--color-primary))',
              }}
            >
              {plan.id === 'free' ? 'Start free' : `Choose ${plan.name}`}
            </Link>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  )
}
