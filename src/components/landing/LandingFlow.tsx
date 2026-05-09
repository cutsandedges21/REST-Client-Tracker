import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FlowArt } from './FlowArt'
import { FlowSection } from './FlowSection'
import { RevenueMockup } from './mockups/RevenueMockup'
import { EmailMockup } from './mockups/EmailMockup'
import { ScheduleMockup } from './mockups/ScheduleMockup'
import { TrackMockup } from './mockups/TrackMockup'

type Feature = {
  id: string
  letter: 'R' | 'E' | 'S' | 'T'
  label: string
  headlineLines: [string, string]
  body: string
  mockup: ReactNode
  background: string
}

const FEATURES: Feature[] = [
  {
    id: 'revenue',
    letter: 'R',
    label: 'Revenue',
    headlineLines: ['Know what you\'re actually', 'earning.'],
    body:
      'Per-cut rates, recurring frequencies, expenses, and one-time tasks all roll up into a live monthly profit number. No more guessing.',
    mockup: <RevenueMockup />,
    background:
      'linear-gradient(135deg, rgb(var(--color-primary-dark)) 0%, rgb(var(--color-primary)) 100%)',
  },
  {
    id: 'email',
    letter: 'E',
    label: 'Email',
    headlineLines: ['Reminders that send', 'themselves.'],
    body:
      'Clients get auto-reminders before each appointment via Gmail or EmailJS. No more "did I confirm Tuesday?" — REST handles it for you.',
    mockup: <EmailMockup />,
    background:
      'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)',
  },
  {
    id: 'schedule',
    letter: 'S',
    label: 'Schedule',
    headlineLines: ['A calendar built for the', 'route, not the office.'],
    body:
      'Drag, drop, reschedule. Conflicts caught automatically. Recurring jobs auto-populate the week so your route plans itself.',
    mockup: <ScheduleMockup />,
    background:
      'linear-gradient(135deg, rgb(var(--color-primary-dark)) 0%, rgb(var(--color-primary)) 100%)',
  },
  {
    id: 'track',
    letter: 'T',
    label: 'Track',
    headlineLines: ['Every client. Every detail.', 'Always with you.'],
    body:
      'Contact info, addresses, service history, notes, and per-client profitability — searchable in a tap, on any device.',
    mockup: <TrackMockup />,
    background:
      'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)',
  },
]

export function LandingFlow() {
  return (
    <FlowArt aria-label="REST features">
      {FEATURES.map((feature) => (
        <FlowSection
          key={feature.id}
          aria-label={feature.label}
          style={{ background: feature.background }}
        >
          <FlowSectionContent feature={feature} />
        </FlowSection>
      ))}
    </FlowArt>
  )
}

function FlowSectionContent({ feature }: { feature: Feature }) {
  return (
    <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
      <div className="flex max-w-xl flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex w-fit items-center gap-3 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 backdrop-blur-md"
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-bold shadow-sm"
            style={{ color: 'rgb(var(--color-primary-dark))' }}
          >
            {feature.letter}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {feature.label}
          </span>
        </motion.div>

        <h3 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {feature.headlineLines[0]}
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {feature.headlineLines[1]}
          </motion.span>
        </h3>

        <motion.p
          className="text-base leading-relaxed text-white/85 md:text-lg"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {feature.body}
        </motion.p>
      </div>

      <motion.div
        className="flex w-full max-w-md items-center justify-center lg:max-w-lg"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-20% 0px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {feature.mockup}
      </motion.div>
    </div>
  )
}
