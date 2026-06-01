# Stylized invoices via Resend — setup

Invoices are sent as a branded HTML email (logo header, accent banner, details
table, footer) through **Resend**, from a Supabase Edge Function that holds your
API key server-side. The app shows a live preview before sending.

## Cost

**Free tier:** Resend includes **3,000 emails/month (100/day)** at no cost —
plenty for invoicing. Supabase Edge Functions are free on the free tier.

## How it works

```
App (preview HTML) ──► send-invoice Edge Function ──► Resend ──► client's inbox
                         (holds RESEND_API_KEY)        reply-to = your email
```

The "from" address is fixed server-side (your verified sender); the client's
reply goes to your own email.

---

## Setup (one time)

### 1. Create a Resend account + API key
1. Sign up at <https://resend.com> (free).
2. **API Keys → Create API Key** → copy it (`re_...`).

### 2. Set up a sender address
Resend will only deliver to arbitrary recipients (your clients) from a **verified
domain**.

- **Best (real domain):** **Domains → Add Domain**, add the DNS records Resend
  shows, wait for "Verified". Your sender becomes e.g. `invoices@yourdomain.com`.
- **No domain yet (testing):** you can use `onboarding@resend.dev` as the sender,
  but Resend will only let you send to **your own account email** until a domain
  is verified. Good for a quick test, not for real client invoicing.

### 3. Store the secrets in Supabase
```bash
supabase link --project-ref apkysupvpahnkibjfrin   # if not already linked
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxx \
  INVOICE_FROM="Your Business <invoices@yourdomain.com>"
```
`INVOICE_FROM` must use your **verified** domain (or `onboarding@resend.dev` for
testing). The display name shows up as the sender.

### 4. Deploy the function
```bash
supabase functions deploy send-invoice
```
(JWT verification stays ON — only your signed-in app can call it.)

---

## Use it
1. In the app, open a client → the **document** icon → **Invoice**.
2. Fill in amount / date / service / message — watch the live **Preview** update.
3. **Send invoice** → it emails the styled invoice to the client; replies come to
   your email.

The **"Open in email app"** button is always available as a no-setup fallback
(plain-text invoice via your own mail app), in case Resend isn't configured.

## Customize the look
- **Business name** and the default **message** live under **More → Invoices**.
- The accent colour automatically matches your current app theme.
- To change layout/branding, edit `renderInvoiceHtml()` in `src/lib/invoice.ts`.

## Troubleshooting
| Symptom | Fix |
| --- | --- |
| "Email sending is not set up yet" | `RESEND_API_KEY` / `INVOICE_FROM` secret missing — re-run step 3, then redeploy. |
| Resend rejects the email (domain) | `INVOICE_FROM` must be a **verified** domain (or `onboarding@resend.dev` to your own address). |
| Nothing sends | `supabase functions logs send-invoice` to see the error. |
