import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AnimatedBackground } from '../components/AnimatedBackground'

type Status = 'working' | 'error'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('working')

  useEffect(() => {
    const exchange = async () => {
      try {
        const url = window.location.href
        const params = new URL(url).searchParams
        const code = params.get('code')
        // mode=reset is appended by resetPasswordForEmail's redirectTo so we
        // can route the user to the password-update form after the code exchange.
        const mode = params.get('mode')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url)
          if (error) {
            console.error('[AuthCallback] code exchange failed:', error.message)
            setStatus('error')
            return
          }
        } else {
          // No code in URL - check if we already have a session (e.g. magic link
          // hash flow handled by detectSessionInUrl). If not, send to /login.
          const { data } = await supabase.auth.getSession()
          if (!data.session) {
            navigate('/login', { replace: true })
            return
          }
        }
        navigate(mode === 'reset' ? '/auth/update-password' : '/app', { replace: true })
      } catch (err) {
        console.error('[AuthCallback] unexpected error:', err)
        setStatus('error')
      }
    }
    void exchange()
  }, [navigate])

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AnimatedBackground />
      <div className="relative z-10 max-w-sm rounded-2xl border border-white/30 bg-white/70 p-6 text-center shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70">
        {status === 'working' ? (
          <p className="text-sm text-slate-600 animate-pulse">Confirming your account…</p>
        ) : (
          <>
            <p className="mb-3 text-sm font-semibold text-red-600">Confirmation failed</p>
            <p className="mb-4 text-xs text-slate-600">
              The link may have expired or already been used. Request a new one from the sign-in page.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: `rgb(var(--color-primary))` }}
            >
              Go to sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
