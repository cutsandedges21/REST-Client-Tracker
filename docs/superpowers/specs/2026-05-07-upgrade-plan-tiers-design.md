# Upgrade Plans & Tiered Pricing — Design

**Date:** 2026-05-07
**Status:** Approved, ready for implementation plan
**Scope:** Add a 3-tier plan system (Free / Pro / Enterprise) with an upgrade page, client-count enforcement on the Free tier, and a tier-aware settings button. Stripe integration is a follow-up step (outlined here, implemented later).

## Goals

- Show the user's current plan and username on the floating settings button.
- Add an `Upgrade` section in the settings panel that navigates to a new pricing page.
- Enforce a 3-client limit on the Free tier with both a disabled submit and an upgrade prompt.
- Centralize plan definitions in one file so future Stripe wiring touches a single source of truth.

## Non-goals

- Real payment processing (separate follow-up).
- Server-side plan enforcement (this app is currently fully client-side / IndexedDB).
- Multi-user / team accounts (an Enterprise marketing bullet only — no implementation).
- Email-based plan receipts.

## Architecture overview

Five touch points:

1. **`src/lib/plans.ts`** — new file. Tier metadata (id, name, price label, tagline, benefits, client limit, highlight flag).
2. **`src/store/clientStore.ts`** — add `plan: PlanId` state, `setPlan` action, and persist per-user plan in localStorage under `userPlans` (keyed by username).
3. **`src/components/SettingsGear.tsx`** — desktop hover pill, mobile persistent chip, new `Upgrade` panel option.
4. **`src/pages/UpgradePage.tsx`** — new page. Three plan cards, current plan badge, CTA buttons.
5. **`src/components/ClientForm.tsx` + `src/App.tsx`** — gate adding the 4th client when on Free.

## Section 1 — Plan model & storage

### `src/lib/plans.ts` (new)

```ts
export type PlanId = 'free' | 'pro' | 'enterprise'

export type Plan = {
  id: PlanId
  name: string
  priceLabel: string         // "$0", "$9/mo", "$29/mo" — placeholder pricing
  tagline: string
  benefits: string[]
  clientLimit: number | null // null = unlimited
  highlight?: boolean        // "Most Popular" styling on Pro
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    tagline: 'Free forever',
    benefits: ['Up to 3 clients', 'Earnings tracker', 'Schedule calendar', 'Email reminders'],
    clientLimit: 3,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$9/mo',
    tagline: 'For growing solo operators',
    benefits: ['Unlimited clients', 'Email automation', 'Advanced analytics', 'Priority support'],
    clientLimit: null,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: '$29/mo',
    tagline: 'For teams & agencies',
    benefits: ['Everything in Pro', 'Multi-user accounts', 'Custom branding', 'API access', 'Dedicated support'],
    clientLimit: null,
  },
]

export const getPlan = (id: PlanId): Plan => PLANS.find((p) => p.id === id)!
```

### Storage in `clientStore.ts`

Add to `ClientState`:

```ts
plan: PlanId
setPlan: (plan: PlanId) => void
```

- Default: `plan: 'free'`.
- On `initialize()`: read `localStorage.userPlans` (a JSON object of `{ [username]: PlanId }`) and set `plan` to the entry for the current username, falling back to `'free'`.
- On `setPlan(plan)`: update zustand state and write back to `localStorage.userPlans[username] = plan`.
- On `setUsername(username)`: re-read the stored plan for that user (or default to free for a brand-new user).

Pricing/benefit content is in `plans.ts`. Per-user state is in `clientStore`. No coupling.

## Section 2 — Settings gear button

Modify `src/components/SettingsGear.tsx`. Add two new props:

```ts
plan: PlanId
username: string | null
```

### Desktop (≥ md breakpoint)

- Default: 48×48 circular button with the gear icon, identical to today.
- On hover or focus-within: framer-motion animates `width` and `borderRadius`, expanding to a pill that shows `[⚙]  {planName} · @{username}` with text fading in.
- On mouse-leave / blur: collapses back to a circle.
- The panel popup behavior is unchanged — clicking still toggles the panel.

### Mobile (< md breakpoint)

- The gear stays the original 48×48 circle.
- A small chip is rendered absolutely positioned 8px **above** the gear, showing two stacked lines:
  - Line 1: `{planName}` in primary-dark color, semibold, 11px uppercase tracking
  - Line 2: `@{username}` in slate-600, 11px
- The chip is non-interactive (pointer-events: none) — it's purely informational. Tapping the gear still opens the panel.

### Panel options

`PANEL_OPTIONS` becomes:

```ts
[
  { view: 'theme',   label: 'Theme',   Icon: Palette },
  { view: 'email',   label: 'Email',   Icon: Mail },
  { view: 'account', label: 'Account', Icon: User },
  { view: 'upgrade', label: 'Upgrade', Icon: CreditCard },
]
```

`SettingsView` type expands to `'main' | 'theme' | 'email' | 'account' | 'upgrade'`.

## Section 3 — Upgrade page

### `src/pages/UpgradePage.tsx` (new)

Props:

```ts
{
  currentPlan: PlanId
  onUpgrade: (plan: PlanId) => void  // hooked to checkout (toast for now)
  onBack: () => void
}
```

Layout:

- Wraps `<SettingsPage title="Upgrade Plan" onBack={onBack}>`.
- Below the header: a brief one-line intro.
- A responsive grid: `grid grid-cols-1 md:grid-cols-3 gap-4`. Each cell is a `<GlowCard>`.

Card content per tier:

- Plan name (lg, bold, primary-dark color).
- Price label (3xl bold) + tagline (slate-600, sm).
- Bulleted benefits list with check icons.
- CTA button at the bottom:
  - If `tier.id === currentPlan` → `Current Plan` badge instead of a button (disabled appearance).
  - Else → `Upgrade to {Name}` button. On click: `onUpgrade(tier.id)` — initial implementation just calls `toast.info('Stripe checkout coming soon')`.
- If `tier.highlight` → small `Most Popular` ribbon at the top right of the card and a thicker primary-color border.

Pro and Enterprise cards remain visually distinct via the `highlight` flag (Pro), and a slightly darker accent on Enterprise to signal premium.

### Routing in `App.tsx`

- Add a `view === 'upgrade'` branch that renders `<UpgradePage currentPlan={plan} onUpgrade={handleUpgrade} onBack={() => setView('main')} />`.
- `handleUpgrade` for now: `(planId) => toast.info('Stripe checkout coming soon')`. Later this becomes a redirect to a Stripe Checkout session URL.

## Section 4 — Free tier 3-client enforcement

### Logic in `App.tsx`

```ts
const atClientLimit =
  plan === 'free' &&
  PLANS.find((p) => p.id === plan)!.clientLimit !== null &&
  clients.length >= PLANS.find((p) => p.id === plan)!.clientLimit!
```

(In practice, store this as a memo using `getPlan(plan).clientLimit`.)

Pass `atLimit={atClientLimit}` and `onUpgradeRequired={() => setView('upgrade')}` into `<ClientForm />`.

### Changes to `ClientForm.tsx`

New props:

```ts
atLimit?: boolean
onUpgradeRequired?: () => void
```

Behavior when `atLimit === true`:

- A small banner above the form (inside the GlowCard, above the heading): warning-style, copy:
  > You've hit the 3-client limit on the Free plan. **Upgrade to Pro** for unlimited clients.
  The bold text is a button that calls `onUpgradeRequired()`.
- The submit button:
  - Text becomes `Upgrade to add more clients`.
  - `disabled` styling, but click handler still fires `onUpgradeRequired()` instead of submitting (we override `type="button"` when at limit so the form doesn't try to submit).
- Form fields remain interactive (so people can see what's involved), but submission is blocked.

## Stripe integration plan (follow-up — not in this spec's scope)

After the UI work above ships, Stripe integration involves:

1. **Stripe account setup** — create an account, configure products/prices for Pro and Enterprise, capture publishable + secret keys.
2. **Backend endpoint** — this app is currently 100% client-side. We'll need a small server (Vercel/Netlify/Cloudflare function or a tiny Express service) for two endpoints:
   - `POST /api/checkout` — creates a Stripe Checkout Session and returns its URL.
   - `POST /api/webhook` — receives Stripe events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) and updates plan state.
3. **Plan persistence shift** — once Stripe is the source of truth, plan moves from localStorage to a real user record (likely Supabase or similar). The `setPlan` API stays the same; only its implementation changes.
4. **`onUpgrade` rewire** — replace the toast with `fetch('/api/checkout', ...)` → redirect to `session.url`.
5. **Customer portal** — Stripe-hosted billing portal for users to manage their subscription; CTA on the Account page.
6. **Webhook → plan update** — when a webhook fires, update the user's plan in the database; the next time they load the app, `initialize()` reads the updated plan.

Detailed walkthrough of these steps will be provided after the UI lands.

## Testing notes

- Manual test: log in as a fresh user → confirm `Free Tier · {username}` shows on the gear (hover desktop, persistent mobile).
- Add 3 clients → confirm the 4th-client form blocks correctly (banner + disabled CTA + upgrade redirect).
- Click `Upgrade` in settings panel → page renders with `Current Plan` on Free and CTAs on Pro/Enterprise.
- Toggle plan via temporary devtools (`useClientStore.getState().setPlan('pro')`) → confirm gear updates, client limit lifts.

## Files touched

| File | Change |
|---|---|
| `src/lib/plans.ts` | NEW — plan definitions |
| `src/store/clientStore.ts` | Add `plan`/`setPlan`, persist in localStorage |
| `src/components/SettingsGear.tsx` | Hover pill, mobile chip, `Upgrade` option |
| `src/pages/UpgradePage.tsx` | NEW — pricing page |
| `src/App.tsx` | Route `'upgrade'`, gate ClientForm, wire up plan state |
| `src/components/ClientForm.tsx` | At-limit banner + disabled CTA |
