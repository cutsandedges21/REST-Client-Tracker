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
  /** Accepts a real email or a legacy username. */
  signInWithUsername: (identifier: string, password: string) => Promise<void>
  signUpWithUsername: (username: string, email: string, password: string) => Promise<{ error: Error | null }>
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


// Username-based auth maps "username" -> "username@<domain>". Existing accounts
// use the ".local" domain (what we send to Supabase first). Some Supabase projects
// reject non-public TLDs on SIGNUP, so signup falls back to a valid public TLD when
// ".local" is refused; sign-in tries both so every account keeps working.
const PRIMARY_EMAIL_DOMAIN = 'client-tracker.local'
const FALLBACK_EMAIL_DOMAIN = 'clienttracker.app'
const emailFor = (username: string, domain: string): string => `${username}@${domain}`

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
      signInWithUsername: async (identifier: string, password: string) => {
        const id = identifier.trim()
        // A real email signs in directly. A bare username (no "@") is a legacy
        // account — map it to the placeholder domains, ".local" first.
        const candidates = id.includes('@')
          ? [id]
          : [emailFor(id, PRIMARY_EMAIL_DOMAIN), emailFor(id, FALLBACK_EMAIL_DOMAIN)]
        let lastError: Error | null = null
        for (const email of candidates) {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (!error) return
          lastError = error
        }
        if (lastError) throw lastError
      },
      signUpWithUsername: async (username: string, email: string, password: string) => {
        // Real email is the account identity; username is stored on the profile
        // (via the handle_new_user trigger reading raw_user_meta_data.username).
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
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
