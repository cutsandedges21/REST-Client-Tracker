import { supabase } from './supabase'

export interface SendInvoicePayload {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/**
 * Send a styled HTML invoice via the `send-invoice` Edge Function (which holds the
 * Resend API key server-side). Throws with a friendly message on failure.
 */
export async function sendInvoiceEmail(payload: SendInvoicePayload): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-invoice', { body: payload })
  if (error) throw new Error(error.message || 'Could not send the invoice')
  const result = data as { ok?: boolean; error?: string } | null
  if (!result?.ok) throw new Error(result?.error || 'Could not send the invoice. Is email sending set up?')
}
