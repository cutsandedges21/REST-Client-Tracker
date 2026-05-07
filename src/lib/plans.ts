export type PlanId = 'free' | 'pro' | 'enterprise'

export type Plan = {
  id: PlanId
  name: string
  priceLabel: string
  tagline: string
  benefits: string[]
  clientLimit: number | null
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
      'Earnings tracker',
      'Schedule calendar',
      'Email reminders',
    ],
    clientLimit: 3,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9/mo',
    tagline: 'For growing solo operators',
    benefits: [
      'Unlimited clients',
      'Email automation',
      'Advanced analytics',
      'Priority support',
    ],
    clientLimit: null,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: '$29/mo',
    tagline: 'For teams & agencies',
    benefits: [
      'Everything in Pro',
      'Multi-user accounts',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
    clientLimit: null,
  },
]

export function getPlan(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0]
}
