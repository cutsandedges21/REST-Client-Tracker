import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { GlowCard } from './GlowCard'
import { AnimatedBackground } from './AnimatedBackground'
import { IntroAnimation } from './IntroAnimation'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'
type View = 'auth' | 'forgot' | 'forgot-sent'

interface Props {
  mode?: Mode
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function describeAuthError(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Wrong username or password.'
  }
  if (message.toLowerCase().includes('not confirmed')) {
    return 'Almost there — the project owner needs to turn OFF “Confirm email” in Supabase (Authentication → Sign In / Providers → Email).'
  }
  if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already been registered')) {
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
  const { session, loading: authLoading, signInWithUsername, signUpWithUsername } = useAuth()

  const [view, setView] = useState<View>('auth')
  const [isRegistering, setIsRegistering] = useState(mode === 'signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem('rest-intro-seen') !== '1'
    } catch {
      return true
    }
  })

  const dismissIntro = () => {
    try {
      sessionStorage.setItem('rest-intro-seen', '1')
    } catch {
      // ignore
    }
    setShowIntro(false)
  }

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
      if (!EMAIL_REGEX.test(email.trim())) {
        setError('Enter a valid email address.')
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

        const { error } = await signUpWithUsername(username.trim(), email.trim(), password)
        if (error) {
          setError(describeAuthError(error.message))
          return
        }

        // Sign in immediately (email confirmation should be OFF). The redirect
        // effect then sends the user into the app; if confirmation is still on,
        // explain the one-time setting to flip.
        try {
          await signInWithUsername(email.trim(), password)
        } catch (signInErr) {
          setError(describeAuthError(signInErr instanceof Error ? signInErr.message : 'not confirmed'))
        }
      } finally {
        setSubmitting(false)
      }
    } else {
      if (!email.trim() || !password) {
        setError('Enter your username and password.')
        return
      }
      setSubmitting(true)
      try {
        await signInWithUsername(email.trim(), password)
        // onAuthStateChange will update session; the redirect effect above will fire.
      } catch (signInError) {
        setError(describeAuthError(signInError instanceof Error ? signInError.message : 'Sign in failed'))
        return
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

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setResetError('')
    if (!EMAIL_REGEX.test(resetEmail.trim())) {
      setResetError('Enter the email address on your account.')
      return
    }
    setResetSubmitting(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim(),
        { redirectTo: `${window.location.origin}/auth/callback?mode=reset` },
      )
      if (resetErr) {
        setResetError(resetErr.message || 'Could not send reset email. Try again.')
        return
      }
      setView('forgot-sent')
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <AnimatePresence>{showIntro && <IntroAnimation onDone={dismissIntro} />}</AnimatePresence>
      <AnimatedBackground />
      <div className="relative z-10 w-full flex flex-col items-center gap-3">
        <GlowCard>
          <div className="w-full max-w-md p-5 sm:p-7 md:p-8">
            {view === 'forgot' ? (
              <ForgotPasswordView
                email={resetEmail}
                onEmailChange={setResetEmail}
                onSubmit={handleForgotPassword}
                submitting={resetSubmitting}
                error={resetError}
                onBack={() => { setView('auth'); setResetError('') }}
              />
            ) : view === 'forgot-sent' ? (
              <ForgotSentView email={resetEmail} onBack={() => setView('auth')} />
            ) : confirmationSent ? (
              <ConfirmationSentView username={username} onBack={() => setConfirmationSent(false)} />
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

                  <Field label={isRegistering ? 'Email' : 'Username'}>
                    <input
                      type={isRegistering ? 'email' : 'text'}
                      inputMode={isRegistering ? 'email' : 'text'}
                      autoComplete={isRegistering ? 'email' : 'username'}
                      autoCapitalize="none"
                      spellCheck={false}
                      className={inputClasses}
                      placeholder={isRegistering ? 'you@email.com' : 'Your username'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Password</span>
                      {!isRegistering && (
                        <button
                          type="button"
                          onClick={() => { setView('forgot'); setResetEmail(email.trim()); setResetError('') }}
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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
                  </div>

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
        <p className="text-center text-xs text-slate-400">
          By signing up you agree to our{' '}
          <a href="/legal/terms" className="underline hover:text-slate-600">Terms</a>
          {' '}and{' '}
          <a href="/legal/privacy" className="underline hover:text-slate-600">Privacy Policy</a>.
        </p>
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

function ConfirmationSentView({ username, onBack }: { username: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <h1
        className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl"
        style={{ color: `rgb(var(--color-primary-dark))` }}
      >
        Check your inbox
      </h1>
      <p className="mb-2 text-sm text-slate-600">
        We sent a confirmation link to <span className="font-semibold">{username}@client-tracker.local</span>.
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

function ForgotPasswordView({
  email,
  onEmailChange,
  onSubmit,
  submitting,
  error,
  onBack,
}: {
  email: string
  onEmailChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  error: string
  onBack: () => void
}) {
  return (
    <>
      <h1
        className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl"
        style={{ color: `rgb(var(--color-primary-dark))` }}
      >
        Reset your password
      </h1>
      <p className="mb-5 text-sm text-slate-600">
        Enter your account email and we'll send a reset link.
      </p>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClasses}
            placeholder="you@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ backgroundColor: `rgb(var(--color-primary))` }}
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900"
      >
        ← Back to sign in
      </button>
    </>
  )
}

function ForgotSentView({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <h1
        className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl"
        style={{ color: `rgb(var(--color-primary-dark))` }}
      >
        Check your inbox
      </h1>
      <p className="mb-2 text-sm text-slate-600">
        If an account exists for <span className="font-semibold">{email}</span>, we sent a
        password reset link. It may take a minute to arrive.
      </p>
      <p className="mb-6 text-sm text-slate-600">
        Click the link in the email, then set your new password.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Back to sign in
      </button>
    </div>
  )
}
