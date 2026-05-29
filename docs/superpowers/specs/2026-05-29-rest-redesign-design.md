# REST — Mobile redesign + feature pass (design spec)

Date: 2026-05-29

REST (Revenue · Email · Schedule · Track) is a mobile-first client tracker for a
solo service operator (lawn care). This pass redesigns the shell for mobile,
adds finance/invoicing features, persists everything to Supabase, and wires
Stripe — while keeping the existing light/dark + 6-colour theming intact.

## Decisions (from the user)

- **Stripe**: in scope, on the free path (free account + Supabase Edge Functions).
  Delivered with a foolproof runbook (`docs/SETUP-stripe.md`).
- **Data**: one-time tasks + expenses were `localStorage`-only. One-time tasks are
  removed (the existing *completed jobs* flow already covers ad-hoc work);
  expenses move to Supabase. Added an explicit save-on-logout / load-on-login
  snapshot cache for resilience and instant hydration.
- **Profit**: show both **Margin** (`profit/revenue`) and **Markup**
  (`profit/cost`), correctly labelled, plus an **hourly rate**.
- **Email**: EmailJS removed entirely (too much per-user config). Invoicing is now
  a compose-and-send flow via the user's own email app (`mailto:`), with a saved
  default template. Appointment reminders became in-app toasts + optional browser
  notifications.

## Architecture

- React 19 + Vite + Tailwind 3 + Zustand + Supabase + framer-motion + recharts.
- **Type system**: `Plus Jakarta Sans` (UI) + `Fraunces` (display, big figures),
  loaded in `index.html`, exposed via Tailwind `font-sans` / `font-display`.
- **Shell** (`AuthedApp`): bottom tab nav on mobile, top pill nav on desktop
  (`AppNav`). Tabs: **Home** (all-time stats, monthly projection, charts),
  **Clients** (search, list, add, expenses), **Schedule** (calendar), **More**
  (settings menu → Theme / Invoices / Account / Plan).
- **Intro**: `IntroAnimation` plays once per session on the login route — "REST"
  assembles, each letter reveals its word, then lifts to expose the (back-button-
  free) login page; then the dashboard.
- **Data layer**: `lib/api.ts` (typed Supabase surface) + `store/clientStore.ts`
  (Zustand). All mutations write to Supabase immediately and mirror into a
  per-user local snapshot (`rest-cache-<username>`); login hydrates from the
  snapshot instantly, then refreshes from the network.

## Data model changes (`supabase/schema.sql`, idempotent)

- `clients.expense_type` `'fixed' | 'percent'`.
- `service_frequency`: drop `three_weeks` (migrate → `monthly`); add `one_time`,
  `six_weeks`, `two_months`. Monthly multipliers in `lib/finance.ts` use a clean
  4-weeks-per-month model: weekly 4, biweekly 2, monthly 1, six_weeks ≈0.67,
  two_months 0.5, one_time 0.
- New `expenses` table (RLS, per-user).
- `profiles`: `invoice_template`, `business_name`, `stripe_customer_id`.

## Stripe

- `supabase/functions/create-checkout-session` (JWT-verified): finds/creates the
  Stripe customer, creates a subscription Checkout Session, returns the URL.
- `supabase/functions/stripe-webhook` (`--no-verify-jwt`): on checkout/subscription
  events, writes `profiles.plan` (and `stripe_customer_id`) via the service role.
- `lib/billing.ts` `startCheckout(plan)` invokes the function and redirects.
- `?checkout=success` on return triggers a profile refresh.

## Out of scope / deferred

- Stripe Customer Portal for in-app downgrades (cancel via receipt link for now).
- Server-side email sending (intentionally avoided to keep zero-config + free).
