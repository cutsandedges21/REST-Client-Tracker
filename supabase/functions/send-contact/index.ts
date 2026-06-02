// Supabase Edge Function: send-contact
// Forwards a user's message / feedback to the app owner through the owner's Gmail
// (SMTP + App Password), tagged with their plan so Priority (Pro) and Dedicated
// (Enterprise) messages can be triaged.
//
// Deploy (JWT verification ON — called by the signed-in app):
//   supabase functions deploy send-contact
//
// Required secrets (see docs/SETUP-email-gmail.md):
//   GMAIL_USER          — the Gmail address that sends the mail
//   GMAIL_APP_PASSWORD  — a 16-char Google App Password
//   MAIL_FROM_NAME      — (optional) sender display name
//   CONTACT_TO          — where messages land (defaults to GMAIL_USER, then rest.invoice@gmail.com)
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { MailNotConfiguredError, sendMail } from '../_shared/mailer.ts'

const APP_URL = Deno.env.get('APP_URL') ?? ''
const DEFAULT_TO = 'rest.invoice@gmail.com'
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const PLAN_PRIORITY: Record<string, string> = {
  free: 'Standard',
  pro: 'Priority',
  enterprise: 'Dedicated',
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

    const { message, fromEmail, fromName, plan, username } = (await req.json()) as {
      message?: string
      fromEmail?: string
      fromName?: string
      plan?: string
      username?: string
    }

    const trimmed = (message ?? '').trim()
    if (!trimmed) return json(req, { error: 'Message is empty' }, 400)
    if (trimmed.length > 5000) return json(req, { error: 'Message is too long (5000 char max)' }, 400)

    const to = Deno.env.get('CONTACT_TO') ?? Deno.env.get('GMAIL_USER') ?? DEFAULT_TO
    const priority = PLAN_PRIORITY[plan ?? 'free'] ?? 'Standard'
    const replyTo = fromEmail || user.email || undefined
    const senderLabel = fromName || username || user.email || 'A REST user'

    const subject = `[REST · ${priority}] Message from ${senderLabel}`
    const html = `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#0f172a; line-height:1.55;">
        <p style="margin:0 0 12px;"><strong>${escapeHtml(priority)} support message</strong></p>
        <table style="border-collapse:collapse; font-size:14px; margin-bottom:16px;">
          <tr><td style="padding:2px 12px 2px 0; color:#64748b;">From</td><td>${escapeHtml(senderLabel)}</td></tr>
          <tr><td style="padding:2px 12px 2px 0; color:#64748b;">Username</td><td>${escapeHtml(username ?? '—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0; color:#64748b;">Plan</td><td>${escapeHtml(plan ?? 'free')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0; color:#64748b;">Reply-to</td><td>${escapeHtml(replyTo ?? '—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0; color:#64748b;">User ID</td><td>${escapeHtml(user.id)}</td></tr>
        </table>
        <div style="white-space:pre-wrap; padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">${escapeHtml(
          trimmed,
        )}</div>
      </div>`

    try {
      await sendMail({ to, subject, html, replyTo })
    } catch (err) {
      if (err instanceof MailNotConfiguredError) return json(req, { error: err.message }, 503)
      console.error('[send-contact] smtp', err)
      return json(req, { error: err instanceof Error ? err.message : 'Could not send your message' }, 502)
    }

    return json(req, { ok: true })
  } catch (error) {
    console.error('[send-contact]', error)
    return json(req, { error: error instanceof Error ? error.message : 'Server error' }, 500)
  }
})
