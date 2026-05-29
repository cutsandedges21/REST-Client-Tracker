// Supabase Edge Function: stripe-webhook
// Listens for Stripe events and syncs the user's plan into public.profiles.
//
// IMPORTANT — deploy WITHOUT JWT verification (Stripe does not send a Supabase JWT):
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Required secrets (see docs/SETUP-stripe.md):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type Plan = 'free' | 'pro' | 'enterprise'

async function setPlan(userId: string, plan: Plan, customer?: string | null) {
  const patch: Record<string, unknown> = { plan }
  if (typeof customer === 'string') patch.stripe_customer_id = customer
  const { error } = await admin.from('profiles').update(patch).eq('id', userId)
  if (error) console.error('[stripe-webhook] setPlan failed:', error)
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed:', error)
    return new Response(`Webhook Error: ${error instanceof Error ? error.message : 'bad signature'}`, {
      status: 400,
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const userId = (s.metadata?.user_id ?? s.client_reference_id) || null
        const plan = (s.metadata?.plan as Plan | undefined) ?? 'pro'
        if (userId) await setPlan(userId, plan, s.customer as string)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id || null
        const plan = (sub.metadata?.plan as Plan | undefined) ?? 'pro'
        const active = sub.status === 'active' || sub.status === 'trialing'
        if (userId) await setPlan(userId, active ? plan : 'free', sub.customer as string)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id || null
        if (userId) await setPlan(userId, 'free', sub.customer as string)
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error('[stripe-webhook] handler error:', error)
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
