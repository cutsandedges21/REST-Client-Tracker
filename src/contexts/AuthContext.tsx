import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../types/database'

type AuthState = {
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Username/password auth helpers
  signInWithUsername: (username: string, password: string) => Promise<void>
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[AuthContext] failed to fetch profile:', error)
    return null
  }
  return data
}

async function fetchProfileByUsername(username: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    console.error('[AuthContext] failed to fetch profile by username:', error)
    return null
  }
  return data
}

// Generate a placeholder email from username for Supabase auth operations.
// NOTE: Supabase rejects non-public TLDs like ".local" on signup, so we use a
// real public TLD. No mail is ever sent (email confirmation must be disabled).
const AUTH_EMAIL_DOMAIN = 'clienttracker.app'
const generatePlaceholderEmail = (username: string): string => {
  return `${username}@${AUTH_EMAIL_DOMAIN}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (cancelled) return
        setSession(data.session)
        if (data.session?.user) {
          const p = await fetchProfile(data.session.user.id)
          if (!cancelled) setProfile(p)
        }
      })
      .catch((error) => {
        console.error('[AuthContext] getSession failed:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // IMPORTANT: keep this callback synchronous. supabase-js holds an internal
    // auth lock while firing these events; awaiting another supabase call (e.g.
    // fetchProfile -> supabase.from) inside the callback deadlocks the lock and
    // hangs getSession() forever. Defer any supabase calls with setTimeout(0).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        const userId = nextSession.user.id
        setTimeout(() => {
          void fetchProfile(userId).then((p) => {
            if (!cancelled) setProfile(p)
          })
        }, 0)
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signOut: async () => {
        await supabase.auth.signOut()
      },
      refreshProfile: async () => {
        if (!session?.user) return
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      },
      // Username/password auth helpers
      signInWithUsername: async (username: string, password: string) => {
        // New accounts use a public-TLD domain; older accounts used "@client-tracker.local".
        // Try the current domain first, then fall back to the legacy one so existing
        // users keep working without any migration.
        const candidates = [generatePlaceholderEmail(username), `${username}@client-tracker.local`]
        let lastError: Error | null = null
        for (const email of candidates) {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (!error) {
            console.log('[AuthContext] Sign in successful for username:', username)
            return
          }
          lastError = error
        }
        console.error('[AuthContext] Sign in error:', lastError)
        if (lastError) throw lastError
      },
      signUpWithUsername: async (username: string, password: string) => {
        const email = generatePlaceholderEmail(username)
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        return { error }
      },
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
