// Username-based accounts log in with a synthetic "username@<domain>" address.
// These are internal login identifiers, NOT real mailboxes, so they must never be
// shown to clients or used as an email reply-to.
// (Domains mirror PRIMARY_EMAIL_DOMAIN / FALLBACK_EMAIL_DOMAIN in AuthContext.)
export const SYNTHETIC_EMAIL_DOMAINS = ['client-tracker.local', 'clienttracker.app']

/** True when an email is a synthetic username login address rather than a real mailbox. */
export function isSyntheticEmail(email?: string | null): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  return SYNTHETIC_EMAIL_DOMAINS.some((domain) => lower.endsWith(`@${domain}`))
}

/** Returns the email only when it's a real, client-facing address (else undefined). */
export function realEmailOrUndefined(email?: string | null): string | undefined {
  return email && !isSyntheticEmail(email) ? email : undefined
}
