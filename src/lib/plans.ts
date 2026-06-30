export type PlanId = 'free' | 'pro' | 'enterprise'

export type SupportTier = 'standard' | 'priority' | 'dedicated'

export type Plan = {
  id: PlanId
  name: string
  priceLabel: string
  tagline: string
  benefits: string[]
  /** Max recurring clients. null = unlimited. */
  clientLimit: number | null
  /** Whether the plan can create & send client invoices. */
  canInvoice: boolean
  /** Unlocks the profit-trend + revenue-by-client charts on Home. */
  advancedAnalytics: boolean
  /** How contact-form messages from this plan are flagged for triage. */
  supportTier: SupportTier
  highlight?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    tagline: 'Free forever',
    benefits: [
      'Up to 3 clients',
      'Earnings & profit tracker',
      'Schedule calendar',
      'Appointment reminders',
    ],
    clientLimit: 3,
    canInvoice: false,
    advancedAnalytics: false,
    supportTier: 'standard',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$38/mo',
    tagline: 'For growing solo operators',
    benefits: [
      'Everything in Free',
      'Up to 10 clients',
      'Custom email invoices',
      'Advanced analytics',
      'Priority support',
    ],
    clientLimit: 10,
    canInvoice: true,
    advancedAnalytics: true,
    supportTier: 'priority',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: '$69/mo',
    tagline: 'For high-volume operators',
    benefits: ['Everything in Pro', 'Unlimited clients', 'Customizable UI'],
    clientLimit: null,
    canInvoice: true,
    advancedAnalytics: true,
    supportTier: 'dedicated',
  },
]

export function getPlan(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0]
}

/** The next tier up, used for upgrade prompts. null when already on the top tier. */
export function nextPlan(id: PlanId): Plan | null {
  const idx = PLANS.findIndex((p) => p.id === id)
  return idx >= 0 && idx < PLANS.length - 1 ? PLANS[idx + 1] : null
}

export const SUPPORT_TIER_LABEL: Record<SupportTier, string> = {
  standard: 'Standard',
  priority: 'Priority',
  dedicated: 'Dedicated',
}
