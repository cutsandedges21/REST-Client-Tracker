// Supabase Edge Function: send-invoice
// Sends a styled HTML invoice through the owner's Gmail (SMTP + App Password)
// on behalf of the signed-in user.
//
// Deploy (JWT verification ON — called by the signed-in app):
//   supabase functions deploy send-invoice
//
// Required secrets (see docs/SETUP-email-gmail.md):
//   GMAIL_USER          — the Gmail address that sends the mail
//   GMAIL_APP_PASSWORD  — a 16-char Google App Password
//   MAIL_FROM_NAME      — (optional) sender display name, e.g. your business name
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { MailNotConfiguredError, sendMail } from '../_shared/mailer.ts'

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

    try {
      await sendMail({ to, subject: subject || 'Your invoice', html, replyTo })
    } catch (err) {
      if (err instanceof MailNotConfiguredError) return json(req, { error: err.message }, 503)
      console.error('[send-invoice] smtp', err)
      return json(req, { error: err instanceof Error ? err.message : 'Could not send the invoice' }, 502)
    }

    return json(req, { ok: true })
  } catch (error) {
    console.error('[send-invoice]', error)
    return json(req, { error: error instanceof Error ? error.message : 'Server error' }, 500)
  }
})
