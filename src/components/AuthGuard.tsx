import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useClientStore } from '../store/clientStore'
import { emailService } from '../services/emailService.js'

type AuthState = 'checking' | 'authed' | 'unauthed'

type StoredAuth = { username?: unknown; expiry?: unknown }

export function AuthGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('checking')
  const setUsername = useClientStore((s) => s.setUsername)

  useEffect(() => {
    try {
      const auth = localStorage.getItem('userAuth')
      if (!auth) {
        setState('unauthed')
        return
      }
      const parsed = JSON.parse(auth) as StoredAuth
      const username = typeof parsed.username === 'string' ? parsed.username : null
      const expiry = typeof parsed.expiry === 'number' ? parsed.expiry : 0
      if (!username || Date.now() >= expiry) {
        localStorage.removeItem('userAuth')
        setState('unauthed')
        return
      }
      setUsername(username)
      emailService.setUsername(username)
      setState('authed')
    } catch {
      localStorage.removeItem('userAuth')
      setState('unauthed')
    }
  }, [setUsername])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">Loading…</p>
      </div>
    )
  }
  if (state === 'unauthed') return <Navigate to="/login" replace />
  return <>{children}</>
}
