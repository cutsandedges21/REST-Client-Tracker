// Supabase Edge Function: send-invoice
// Sends a styled HTML invoice via Resend on behalf of the signed-in user.
//
// Deploy (JWT verification ON — called by the signed-in app):
//   supabase functions deploy send-invoice
//
// Required secrets (see docs/SETUP-resend.md):
//   RESEND_API_KEY   — your Resend API key (re_...)
//   INVOICE_FROM     — verified sender, e.g. "Jordan's Lawn Care <invoices@yourdomain.com>"
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

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
    // Verify the caller is signed in.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return json(req, { error: 'Unauthorized' }, 401)

    const { to, subject, html, replyTo } = (await req.json()) as {
      to?: string
      subject?: string
      html?: string
      replyTo?: string
    }
    if (!to || !html) return json(req, { error: 'Missing recipient or content' }, 400)

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) return json(req, { error: 'Invalid recipient email address' }, 400)
    if (replyTo && !emailRegex.test(replyTo)) return json(req, { error: 'Invalid reply-to email address' }, 400)

    // Enforce reasonable size limits
    if (html.length > 100_000) return json(req, { error: 'Invoice content too large' }, 400)
    if (subject && subject.length > 200) return json(req, { error: 'Subject line too long' }, 400)

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('INVOICE_FROM')
    if (!apiKey || !from) {
      return json(req, { error: 'Email sending is not set up yet (RESEND_API_KEY / INVOICE_FROM).' }, 503)
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: subject || 'Your invoice',
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return json(req, { error: (data as { message?: string })?.message || 'Resend rejected the email' }, 502)
    }
    return json(req, { ok: true, id: (data as { id?: string })?.id })
  } catch (error) {
    console.error('[send-invoice]', error)
    return json(req, { error: error instanceof Error ? error.message : 'Server error' }, 500)
  }
})
