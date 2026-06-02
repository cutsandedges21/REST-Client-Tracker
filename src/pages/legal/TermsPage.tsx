import { useNavigate } from 'react-router-dom'

export function TermsPage() {
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

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
      <p className="mb-8 text-sm text-slate-500">Last updated: June 2026</p>

      <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using REST ("the Service"), you agree to be bound by these Terms of
            Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">2. Description of Service</h2>
          <p>
            REST is a client and job tracking tool for independent service operators. Features
            include client management, scheduling, earnings tracking, route planning, and invoice
            generation.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">3. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account. You must be at least 18 years old to
            create an account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Upload malicious code or interfere with the Service's operation</li>
            <li>Resell or sublicense access to the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">5. Paid Plans and Billing</h2>
          <p>
            Paid plan subscriptions are billed monthly. You may cancel at any time; cancellation
            takes effect at the end of the current billing period. Refunds are not provided for
            partial months. Prices may change with 30 days' notice.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">6. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/legal/privacy" className="underline hover:text-slate-900">
              Privacy Policy
            </a>
            . You retain ownership of the data you enter into the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. We do not guarantee
            uninterrupted or error-free operation.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for any indirect, incidental,
            or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">9. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of the Service after changes are
            posted constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">10. Contact</h2>
          <p>
            Questions about these terms? Email us at{' '}
            <a href="mailto:support@clienttracker.app" className="underline hover:text-slate-900">
              support@clienttracker.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
