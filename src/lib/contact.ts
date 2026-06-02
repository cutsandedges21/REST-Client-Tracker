import { supabase } from './supabase'

export interface ContactPayload {
  message: string
  /** Sender's email so replies go straight back to them. */
  fromEmail?: string
  /** Sender's account/business name for context. */
  fromName?: string
  /** Plan id — lets the owner triage Priority / Dedicated first. */
  plan?: string
  username?: string
}

/**
 * Send a message/feedback to the app owner via the `send-contact` Edge Function
 * (which holds the Resend key server-side). Throws with a friendly message.
 */
export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-contact', { body: payload })
  if (error) throw new Error(error.message || 'Could not send your message')
  const result = data as { ok?: boolean; error?: string } | null
  if (!result?.ok) throw new Error(result?.error || 'Could not send your message. Please try again.')
}
