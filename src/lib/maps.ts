/**
 * Build a directions URL for an address. Opens the device's default maps app
 * (Google Maps on Android/desktop, Apple/Google Maps on iOS) — no API key,
 * no in-app map. Returns null when there's no address to navigate to.
 */
export function directionsUrl(address: string): string | null {
  const trimmed = address.trim()
  if (!trimmed) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmed)}`
}
