import { useNavigate } from 'react-router-dom'

export function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Back
      </button>

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mb-8 text-sm text-slate-500">Last updated: June 2026</p>

      <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">1. Information We Collect</h2>
          <p>We collect the following information when you use REST:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Account information:</strong> email address, username, and password (stored
              as a secure hash via Supabase Auth)
            </li>
            <li>
              <strong>Business data you enter:</strong> client names, phone numbers, email
              addresses, addresses, job records, appointments, and expenses
            </li>
            <li>
              <strong>Payment information:</strong> processed by Stripe — we store only a Stripe
              customer ID, not card details
            </li>
            <li>
              <strong>Usage data:</strong> standard server logs (IP address, browser type,
              timestamps) retained for up to 90 days
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">2. How We Use Your Information</h2>
          <p>Your information is used solely to:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Operate and improve the Service</li>
            <li>Process payments and manage your subscription</li>
            <li>Send transactional emails (invoices, password resets) that you initiate</li>
            <li>Respond to support requests</li>
          </ul>
          <p className="mt-2">
            We do not sell your data or use it for advertising.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">3. Data Storage and Security</h2>
          <p>
            Your data is stored in Supabase (PostgreSQL) with row-level security policies ensuring
            only you can access your records. Data is encrypted in transit (TLS) and at rest.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">4. Third-Party Services</h2>
          <p>We use the following sub-processors:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Supabase</strong> — database and authentication
            </li>
            <li>
              <strong>Stripe</strong> — payment processing
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery
            </li>
            <li>
              <strong>Vercel</strong> — hosting and edge functions
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">5. Your Rights</h2>
          <p>You can at any time:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Export or delete your data via the Account settings page</li>
            <li>Request a full data export or permanent deletion by emailing us</li>
            <li>Cancel your subscription without penalty</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">6. Cookies</h2>
          <p>
            We use only essential session cookies required for authentication. No tracking or
            advertising cookies are used.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">7. Children's Privacy</h2>
          <p>
            The Service is not directed at children under 13. We do not knowingly collect data
            from children.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">8. Changes to This Policy</h2>
          <p>
            We will notify you of material changes by email or by a prominent notice in the app at
            least 14 days before changes take effect.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">9. Contact</h2>
          <p>
            Privacy questions or data requests:{' '}
            <a href="mailto:support@clienttracker.app" className="underline hover:text-slate-900">
              support@clienttracker.app
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
