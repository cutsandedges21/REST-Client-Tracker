export const DEFAULT_INVOICE_TEMPLATE = `Hi {{client}},

Thanks for your business! Here is your invoice from {{business}}.

Service: {{service}}
Date: {{date}}
Amount due: {{amount}}

Payment can be made by cash, e-transfer, or cheque. Reply to this email with any questions.

Thank you,
{{business}}`

export interface InvoiceVars {
  client: string
  business: string
  service: string
  date: string
  amount: string
}

/** Replace {{placeholders}} (case/space tolerant) with their values. */
export function fillTemplate(template: string, vars: InvoiceVars): string {
  const map: Record<string, string> = {
    client: vars.client,
    business: vars.business,
    service: vars.service,
    date: vars.date,
    amount: vars.amount,
  }
  return template.replace(/\{\{\s*(client|business|service|date|amount)\s*\}\}/gi, (_, key: string) =>
    map[key.toLowerCase()] ?? '',
  )
}

/** Build a mailto: URL that opens the user's own email app, pre-filled. */
export function buildMailto(to: string, subject: string, body: string): string {
  // URLSearchParams encodes spaces as "+"; mail clients expect %20.
  const query = new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20')
  return `mailto:${to}?${query}`
}

export const INVOICE_PLACEHOLDERS = ['{{client}}', '{{business}}', '{{service}}', '{{date}}', '{{amount}}']
