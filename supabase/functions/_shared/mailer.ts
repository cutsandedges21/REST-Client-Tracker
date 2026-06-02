// Shared Gmail SMTP mailer for the REST edge functions.
// Sends through the owner's Gmail using an App Password — no custom domain or
// OAuth required. Emails come from the Gmail address (optionally with a display
// name); replies can be routed elsewhere via `replyTo`.
//
// Required secrets:
//   GMAIL_USER          — the full Gmail address (e.g. you@gmail.com)
//   GMAIL_APP_PASSWORD  — a 16-char Google App Password
//                         (Google Account → Security → App passwords; needs 2FA on)
// Optional:
//   MAIL_FROM_NAME      — display name shown as the sender (e.g. "Cuts & Edges")
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

export interface MailMessage {
  to: string
  subject: string
  html: string
  /** Where replies should go (e.g. the sending user's email). */
  replyTo?: string
}

/** Thrown when the Gmail secrets aren't configured, so callers can return 503. */
export class MailNotConfiguredError extends Error {
  constructor(message = 'Email sending is not set up yet (GMAIL_USER / GMAIL_APP_PASSWORD).') {
    super(message)
    this.name = 'MailNotConfiguredError'
  }
}

export async function sendMail({ to, subject, html, replyTo }: MailMessage): Promise<void> {
  const user = Deno.env.get('GMAIL_USER')
  const pass = Deno.env.get('GMAIL_APP_PASSWORD')
  if (!user || !pass) throw new MailNotConfiguredError()

  const fromName = Deno.env.get('MAIL_FROM_NAME')
  const from = fromName ? `${fromName} <${user}>` : user

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  })

  try {
    await client.send({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
  } finally {
    await client.close()
  }
}
