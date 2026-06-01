export const DEFAULT_INVOICE_TEMPLATE = `Hi {{client}},

Thanks for your business! Here is your invoice from {{business}}.

Date: {{date}}
Amount due: {{amount}}

Payment can be made by cash, e-transfer, or cheque. Reply to this email with any questions.

Thank you,
{{business}}`

export interface InvoiceVars {
  client: string
  business: string
  date: string
  amount: string
}

/** Replace {{placeholders}} (case/space tolerant) with their values. */
export function fillTemplate(template: string, vars: InvoiceVars): string {
  const map: Record<string, string> = {
    client: vars.client,
    business: vars.business,
    date: vars.date,
    amount: vars.amount,
  }
  return template.replace(/\{\{\s*(client|business|date|amount)\s*\}\}/gi, (_, key: string) =>
    map[key.toLowerCase()] ?? '',
  )
}

/** Build a mailto: URL that opens the user's own email app, pre-filled (plain-text fallback). */
export function buildMailto(to: string, subject: string, body: string): string {
  const query = new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20')
  return `mailto:${to}?${query}`
}

export const INVOICE_PLACEHOLDERS = ['{{client}}', '{{business}}', '{{date}}', '{{amount}}']

// ---------------- Styled HTML invoice (for Resend) ----------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** "59, 130, 246" -> "#3b82f6" */
export function rgbStringToHex(rgb: string): string {
  const parts = rgb.split(',').map((p) => Math.max(0, Math.min(255, parseInt(p.trim(), 10) || 0)))
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(parts[0] ?? 0)}${h(parts[1] ?? 0)}${h(parts[2] ?? 0)}`
}

export interface InvoiceEmailData {
  businessName: string
  clientName: string
  /** Pre-formatted, e.g. "$50.00" */
  amount: string
  /** Pre-formatted, e.g. "May 31, 2026" */
  date: string
  /** Optional message/blurb (may contain newlines). */
  message?: string
  /** Accent (banner/footer) hex. */
  accentDark: string
  /** Business reply-to email, shown in the footer. */
  replyTo?: string
}

/** Render a branded, email-client-safe HTML invoice (inline styles + tables). */
export function renderInvoiceHtml(d: InvoiceEmailData): string {
  const message = (d.message ?? '').trim()
  const messageHtml = message
    ? message
        .split(/\n{2,}/)
        .map(
          (p) =>
            `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3a3a3a;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`,
        )
        .join('')
    : ''

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invoice</title></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:18px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${d.accentDark};">${escapeHtml(d.businessName)}</div>
        </td></tr>
        <tr><td style="background-color:${d.accentDark};border-radius:14px 14px 0 0;padding:26px 40px;text-align:center;">
          <div style="color:#ffffff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Invoice</div>
          <div style="color:rgba(255,255,255,0.82);font-size:13px;margin-top:4px;">${escapeHtml(d.date)}</div>
        </td></tr>
        <tr><td style="background-color:#ffffff;padding:36px 40px;border-left:1px solid #e6e8eb;border-right:1px solid #e6e8eb;">
          <p style="margin:0 0 18px;font-size:16px;color:#1a1a1a;">Hi ${escapeHtml(d.clientName)},</p>
          ${messageHtml}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;">
            <tr>
              <td style="padding:12px 0;font-size:14px;color:#6b7280;border-bottom:1px solid #eef0f2;">Date</td>
              <td align="right" style="padding:12px 0;font-size:14px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #eef0f2;">${escapeHtml(d.date)}</td>
            </tr>
            <tr>
              <td style="padding:18px 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;">Amount due</td>
              <td align="right" style="padding:18px 0 4px;font-size:24px;font-weight:800;color:${d.accentDark};">${escapeHtml(d.amount)}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background-color:${d.accentDark};border-radius:0 0 14px 14px;padding:24px 40px;text-align:center;">
          <div style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(d.businessName)}</div>
          ${
            d.replyTo
              ? `<div style="margin-top:6px;"><a href="mailto:${escapeHtml(d.replyTo)}" style="color:rgba(255,255,255,0.85);font-size:13px;text-decoration:none;">${escapeHtml(d.replyTo)}</a></div>`
              : ''
          }
          <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:10px;">Sent with REST</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
