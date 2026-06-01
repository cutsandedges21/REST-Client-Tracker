# Stripe setup — step by step (free, no fixed cost)

This wires the **Upgrade** screen to real Stripe Checkout. Plan changes are synced
back into the app automatically by a webhook.

## Does this cost money?

**No fixed cost.**
- A Stripe account is **free**. Stripe only takes a per-transaction fee
  (~2.9% + C$0.30) **when a customer actually pays** — nothing if no one pays.
- The backend runs on **Supabase Edge Functions**, which are included free on
  Supabase's free tier (plenty for this app).
- You can build and fully test everything in Stripe **test mode** for $0.

## How it works (architecture)

```
App  ──(user's JWT)──►  create-checkout-session  ──►  Stripe Checkout page
                                                          │ pays
Stripe  ──(webhook)──►  stripe-webhook  ──►  updates profiles.plan in Supabase
App reloads profile  ◄──────────────────────────────────┘
```

The Stripe secret key lives only inside the Edge Functions — never in the
frontend.

---

## One-time setup

### 1. Install the Supabase CLI and link the project

```bash
npm install -g supabase           # or: brew install supabase/tap/supabase
supabase login                    # opens a browser to authorize
cd client-tracker-app
supabase link --project-ref apkysupvpahnkibjfrin
```

### 2. Create the Stripe products & prices

1. Go to <https://dashboard.stripe.com/test/products> (make sure the toggle in
   the top bar says **Test mode**).
2. **Add product** → name it `REST Pro` → add a **recurring** price of
   `C$18.00 / month` → Save. Copy the **Price ID** (looks like `price_123...`).
3. **Add product** → `REST Enterprise` → recurring `C$29.00 / month` → Save.
   Copy that **Price ID** too.

### 3. Get your secret key

- <https://dashboard.stripe.com/test/apikeys> → copy the **Secret key**
  (`sk_test_...`).

### 4. Store secrets in Supabase (never commit these)

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxxxxxxx \
  STRIPE_PRICE_PRO=price_xxxxxxxx \
  STRIPE_PRICE_ENTERPRISE=price_xxxxxxxx \
  APP_URL=https://your-deployed-url.com
```

`APP_URL` is only a fallback for the success/cancel redirect — the function
prefers the request's own origin, so localhost works automatically in dev.

### 5. Deploy the Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

> `--no-verify-jwt` is **required** for the webhook — Stripe calls it directly
> and does not send a Supabase login token. The checkout function keeps JWT
> verification ON (it's called by the signed-in app).

### 6. Create the webhook in Stripe

1. The webhook URL is:
   `https://apkysupvpahnkibjfrin.supabase.co/functions/v1/stripe-webhook`
2. <https://dashboard.stripe.com/test/webhooks> → **Add endpoint** → paste the URL.
3. **Select events to listen to** → add:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save, then click **Reveal** under *Signing secret* and copy it (`whsec_...`).
5. Store it:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

(No redeploy needed — secrets are read at runtime.)

---

## Test it (test mode)

1. Open the app → **More → Plan → Upgrade to Pro**. You'll land on Stripe Checkout.
2. Pay with the test card: `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.
3. You'll be redirected back to `/app?checkout=success`.
4. Within a second or two the plan badge updates to **Pro** (the webhook wrote it
   to your profile; the app re-reads it).

If the badge doesn't change, check **Stripe → Developers → Webhooks → your
endpoint → events** for delivery errors, and
`supabase functions logs stripe-webhook`.

---

## Going live (when you're ready to charge real money)

1. Flip Stripe to **Live mode** (top-bar toggle).
2. Recreate the two products/prices in live mode → new live `price_...` IDs.
3. Grab the **live** secret key (`sk_live_...`).
4. Recreate the webhook endpoint in live mode → new `whsec_...`.
5. Update the secrets with the live values:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_PRICE_PRO=price_live_... \
     STRIPE_PRICE_ENTERPRISE=price_live_... STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```
6. Done — no code changes needed.

## Canceling / downgrading

Downgrades to Free aren't done in-app (it would require a billing portal). The
simplest free option: customers cancel from the **"Manage billing"** link in the
Stripe receipt email, or add Stripe's Customer Portal later. When a subscription
is canceled, the webhook automatically sets the plan back to `free`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "No checkout URL returned. Is Stripe configured?" | Secrets not set or function not deployed. Re-run steps 4–5. |
| Checkout opens but wrong price | `STRIPE_PRICE_*` points at the wrong/Live-vs-Test price ID. |
| Paid, but plan never updates | Webhook missing/secret wrong. Re-check step 6 + `supabase functions logs stripe-webhook`. |
| 401 from create-checkout-session | User isn't signed in, or function deployed with the wrong JWT flag. |
