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
    priceLabel: '$18/mo',
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

// Users granted full (enterprise/MAX tier) access with unlimited clients.
export const SPECIAL_USERS = ['mb08', 'jt08', 'user_d95b177a']

export function isSpecialUser(username: string | null): boolean {
  return username !== null && SPECIAL_USERS.includes(username)
}
