import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { GlowCard } from '../components/GlowCard'

const MIN_PASSWORD_LENGTH = 8

const inputClasses =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]'

export function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)

  // Block the form until the session check completes. If no session (e.g.
  // someone navigates here directly without clicking a reset link), redirect
  // to login immediately so the form never flashes on screen.
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/login', { replace: true })
      } else {
        setChecking(false)
      }
    })
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message || 'Could not update password. Try again.')
        return
      }
      setDone(true)
      setTimeout(() => navigate('/app', { replace: true }), 2000)
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) return null

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <GlowCard>
          <div className="p-6 sm:p-8">
            {done ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">Password updated!</p>
                <p className="mt-2 text-sm text-slate-600">Taking you to the app…</p>
              </div>
            ) : (
              <>
                <h1
                  className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl"
                  style={{ color: `rgb(var(--color-primary-dark))` }}
                >
                  Set a new password
                </h1>
                <p className="mb-5 text-sm text-slate-600">
                  Choose a strong password you haven't used before.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">New password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className={inputClasses}
                      placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Confirm password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className={inputClasses}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </label>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                    style={{ backgroundColor: `rgb(var(--color-primary))` }}
                  >
                    {submitting ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  )
}
