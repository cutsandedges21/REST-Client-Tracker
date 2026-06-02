# Email via Gmail (App Password) — setup

Invoices and feedback are sent through **your own Gmail** over SMTP, from a Supabase
Edge Function that holds an app password server-side. No custom domain and no OAuth
required — emails come from your Gmail address.

```
App ──► send-invoice / send-contact Edge Function ──► Gmail SMTP ──► recipient
                       (holds GMAIL_APP_PASSWORD)      from: you@gmail.com
```

## Cost & limits

Free. Gmail allows roughly **500 recipients/day** on a personal account — plenty for
invoicing. Supabase Edge Functions are free on the free tier.

## Setup (one time)

### 1. Turn on 2-Step Verification
App passwords require it: <https://myaccount.google.com/security> → **2-Step Verification**.

### 2. Create an App Password
1. Go to <https://myaccount.google.com/apppasswords>.
2. Name it (e.g. "REST invoices") → **Create**.
3. Copy the **16-character** password (spaces don't matter).

### 3. Store the secrets in Supabase
```bash
supabase secrets set --project-ref apkysupvpahnkibjfrin \
  GMAIL_USER="you@gmail.com" \
  GMAIL_APP_PASSWORD="your16charapppass" \
  MAIL_FROM_NAME="Your Business"      # optional sender display name
```
`MAIL_FROM_NAME` is optional; without it the sender shows as the bare Gmail address.
Feedback is delivered to `CONTACT_TO` if set, otherwise to `GMAIL_USER`.

### 4. Deploy the functions (already wired up)
```bash
supabase functions deploy send-invoice
supabase functions deploy send-contact
```
(JWT verification stays ON — only your signed-in app can call them.)

## Use it
1. Open a client → the **document** icon → **Invoice** → fill in, watch the preview.
2. **Send invoice** → it emails the styled invoice from your Gmail; replies come to
   your email.

The **"Open in email app"** button is always available as a no-setup fallback.

## Troubleshooting
| Symptom | Fix |
| --- | --- |
| "Email sending is not set up yet" | `GMAIL_USER` / `GMAIL_APP_PASSWORD` secret missing — re-run step 3. |
| `535 Username and Password not accepted` | Use an **App Password**, not your normal Gmail password; confirm 2FA is on. |
| Nothing sends | `supabase functions logs send-invoice` to see the SMTP error. |
| Hitting the daily cap | Gmail limits ~500 recipients/day; for higher volume use a verified domain + a provider. |
