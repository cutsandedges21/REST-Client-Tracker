// Supabase Edge Function: create-checkout-session
// Creates a Stripe Checkout Session for the signed-in user and returns its URL.
//
// Deploy with JWT verification ON (the app sends the user's auth token):
//   supabase functions deploy create-checkout-session
//
// Required secrets (see docs/SETUP-stripe.md):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '')

const PRICES: Record<string, string | undefined> = {
  pro: Deno.env.get('STRIPE_PRICE_PRO'),
  enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
}

// Restrict CORS to the configured app origin. Falls back to '*' only when
// APP_URL is not set (local dev), since JWT auth is the real gate anyway.
const APP_URL = Deno.env.get('APP_URL') ?? ''
const ALLOWED_ORIGINS = new Set(
  [APP_URL, 'http://localhost:5173', 'http://localhost:4173'].filter(Boolean),
)

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : (APP_URL || '*')
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function json(req: Request, obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return json(req, { error: 'Unauthorized' }, 401)

    const { plan } = (await req.json()) as { plan?: string }
    const price = plan ? PRICES[plan] : undefined
    if (!price) return json(req, { error: 'Invalid or unconfigured plan' }, 400)

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, username')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id as string | null | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: user.id, username: profile?.username ?? '' },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    // Use the server-configured APP_URL for redirects — never trust the
    // request Origin header for this, as it could be spoofed to redirect
    // users to an attacker-controlled page after payment.
    const appUrl = APP_URL || req.headers.get('origin') || ''
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl}/app?checkout=success`,
      cancel_url: `${appUrl}/app?checkout=cancel`,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan: plan! },
      subscription_data: { metadata: { user_id: user.id, plan: plan! } },
    })

    return json(req, { url: session.url })
  } catch (error) {
    console.error('[create-checkout-session]', error)
    return json(req, { error: error instanceof Error ? error.message : 'Server error' }, 500)
  }
})
