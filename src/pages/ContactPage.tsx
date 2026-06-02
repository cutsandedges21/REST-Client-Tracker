import { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { inputClass, labelClass, primaryButtonClass, primaryButtonStyle } from '../lib/ui'
import { cn } from '../lib/utils'
import { sendContactMessage } from '../lib/contact'
import { getPlan, SUPPORT_TIER_LABEL } from '../lib/plans'
import { useAuth } from '../contexts/AuthContext'

type ContactPageProps = {
  onBack: () => void
}

export function ContactPage({ onBack }: ContactPageProps) {
  const { user, profile } = useAuth()
  const plan = getPlan(profile?.plan ?? 'free')
  const defaultName = profile?.account_name?.trim() || profile?.business_name?.trim() || ''

  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      setError('Please write a message first.')
      return
    }
    setSending(true)
    setError(null)
    try {
      await sendContactMessage({
        message: trimmed,
        fromEmail: email.trim() || undefined,
        fromName: name.trim() || undefined,
        plan: profile?.plan ?? 'free',
        username: profile?.username,
      })
      setSent(true)
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <SettingsPage title="Contact & feedback" onBack={onBack}>
      <GlowCard>
        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'rgb(var(--color-primary-dark))' }}>
              Questions or feedback?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Send a note straight to the person who builds REST. Bug reports, feature ideas, billing
              questions — anything. You're on the{' '}
              <span className="font-semibold" style={{ color: 'rgb(var(--color-primary-dark))' }}>
                {plan.name}
              </span>{' '}
              plan, so your message is tagged{' '}
              <span className="font-semibold">{SUPPORT_TIER_LABEL[plan.supportTier]}</span>.
            </p>
          </div>

          {sent ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">Message sent — thank you!</p>
                <p className="mt-1">
                  I'll reply to {email.trim() || 'your account email'} as soon as I can.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-3 text-sm font-medium underline underline-offset-2"
                  style={{ color: 'rgb(var(--color-primary-dark))' }}
                >
                  Send another
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className={labelClass}>Your name</span>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClass}>Your email</span>
                  <input
                    className={inputClass}
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </label>
              </div>

              <label className="space-y-1.5">
                <span className={labelClass}>Message</span>
                <textarea
                  rows={6}
                  className={cn(inputClass, 'resize-none leading-relaxed')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                />
              </label>

              {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

              <div>
                <button
                  type="button"
                  onClick={submit}
                  disabled={sending}
                  className={cn(primaryButtonClass, 'w-full sm:w-auto')}
                  style={primaryButtonStyle}
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </div>
          )}
        </div>
      </GlowCard>
    </SettingsPage>
  )
}
