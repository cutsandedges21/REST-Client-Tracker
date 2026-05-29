import { supabase } from './supabase'
import type { PlanId } from './plans'

export type PaidPlan = Exclude<PlanId, 'free'>

/**
 * Kick off Stripe Checkout for a paid plan. Invokes the `create-checkout-session`
 * Edge Function (which holds the secret keys) and redirects to the hosted page.
 */
export async function startCheckout(plan: PaidPlan): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { plan },
  })
  if (error) throw new Error(error.message || 'Could not start checkout')
  const url = (data as { url?: string } | null)?.url
  if (!url) throw new Error('No checkout URL returned. Is Stripe configured?')
  window.location.href = url
}
