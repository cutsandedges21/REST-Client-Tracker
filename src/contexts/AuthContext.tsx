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
    .select('id, username, plan, created_at')
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
    .select('id, username, plan, created_at')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    console.error('[AuthContext] failed to fetch profile by username:', error)
    return null
  }
  return data
}

// Generate a placeholder email from username for Supabase auth operations
const generatePlaceholderEmail = (username: string): string => {
  return `${username}@client-tracker.local`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      setSession(data.session)
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id)
        if (!cancelled) setProfile(p)
      }
      if (!cancelled) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        const p = await fetchProfile(nextSession.user.id)
        setProfile(p)
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
        const email = generatePlaceholderEmail(username)
        console.log('[AuthContext] Attempting sign in for username:', username, 'email:', email)
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          console.error('[AuthContext] Sign in error:', error)
          throw error
        }
        console.log('[AuthContext] Sign in successful for username:', username)
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
