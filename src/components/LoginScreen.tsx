import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { GlowCard } from './GlowCard'
import { AnimatedBackground } from './AnimatedBackground'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'signup'

interface Props {
  mode?: Mode
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/
const MIN_PASSWORD_LENGTH = 8

function describeAuthError(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Wrong email or password.'
  }
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Please confirm your email — check your inbox for the link.'
  }
  if (message.toLowerCase().includes('user already registered')) {
    return 'An account with that email already exists. Try signing in instead.'
  }
  if (message.toLowerCase().includes('password')) {
    return message
  }
  return message || 'Something went wrong. Try again.'
}

export function LoginScreen({ mode = 'login' }: Props) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, loading: authLoading } = useAuth()

  const [isRegistering, setIsRegistering] = useState(mode === 'signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  useEffect(() => {
    setIsRegistering(mode === 'signup')
    setError('')
    setConfirmationSent(false)
  }, [mode])

  // If already signed in, send to /app
  useEffect(() => {
    if (!authLoading && session) {
      const planParam = searchParams.get('plan')
      navigate(planParam ? `/app?plan=${planParam}` : '/app', { replace: true })
    }
  }, [authLoading, session, navigate, searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (isRegistering) {
      if (!USERNAME_REGEX.test(username.trim())) {
        setError('Username must be 3–24 characters: letters, numbers, underscore.')
        return
      }
      if (!email.trim()) {
        setError('Enter your email.')
        return
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      setSubmitting(true)
      try {
        // Pre-flight: is the username taken?
        const { data: available, error: rpcError } = await supabase.rpc('username_available', {
          check_username: username.trim(),
        })
        if (rpcError) {
          setError('Could not verify username availability. Try again.')
          return
        }
        if (available === false) {
          setError('That username is already taken.')
          return
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) {
          setError(describeAuthError(signUpError.message))
          return
        }

        setConfirmationSent(true)
      } finally {
        setSubmitting(false)
      }
    } else {
      if (!email.trim() || !password) {
        setError('Enter your email and password.')
        return
      }
      setSubmitting(true)
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setError(describeAuthError(signInError.message))
          return
        }
        // onAuthStateChange will update session; the redirect effect above will fire.
      } finally {
        setSubmitting(false)
      }
    }
  }

  const switchMode = () => {
    setIsRegistering((v) => !v)
    setError('')
    setConfirmationSent(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <AnimatedBackground />
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 rounded-full border border-white/30 bg-white/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 backdrop-blur-md transition hover:bg-white/50 sm:left-6 sm:top-6 sm:text-xs dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
      >
        ← Back
      </Link>
      <div className="relative z-10 w-full flex justify-center">
        <GlowCard>
          <div className="w-full max-w-md p-5 sm:p-7 md:p-8">
            {confirmationSent ? (
              <ConfirmationSentView email={email} onBack={() => setConfirmationSent(false)} />
            ) : (
              <>
                <h1
                  className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl"
                  style={{ color: `rgb(var(--color-primary-dark))` }}
                >
                  {isRegistering ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="mb-5 text-sm text-slate-600 sm:mb-6">
                  {isRegistering
                    ? 'Sign up to start tracking your clients.'
                    : 'Sign in to your client tracker.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {isRegistering && (
                    <Field label="Username">
                      <input
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        className={inputClasses}
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </Field>
                  )}

                  <Field label="Email">
                    <input
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      inputMode="email"
                      className={inputClasses}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>

                  <Field label="Password">
                    <input
                      type="password"
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      className={inputClasses}
                      placeholder={
                        isRegistering ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Your password'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>

                  {isRegistering && (
                    <Field label="Confirm password">
                      <input
                        type="password"
                        autoComplete="new-password"
                        className={inputClasses}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Field>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                    style={{ backgroundColor: `rgb(var(--color-primary))` }}
                  >
                    {submitting
                      ? 'Please wait…'
                      : isRegistering
                        ? 'Create account'
                        : 'Sign in'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={switchMode}
                  className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900"
                >
                  {isRegistering
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  )
}

const inputClasses =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] sm:py-2.5 sm:text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function ConfirmationSentView({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <h1
        className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl"
        style={{ color: `rgb(var(--color-primary-dark))` }}
      >
        Check your inbox
      </h1>
      <p className="mb-2 text-sm text-slate-600">
        We sent a confirmation link to <span className="font-semibold">{email}</span>.
      </p>
      <p className="mb-6 text-sm text-slate-600">
        Click the link to finish creating your account, then come back here to sign in.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Back to sign up
      </button>
    </div>
  )
}
