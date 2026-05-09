import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { GlowCard } from './GlowCard'
import { AnimatedBackground } from './AnimatedBackground'
import { useClientStore } from '../store/clientStore'
import { emailService } from '../services/emailService.js'

export function LoginScreen({ mode = 'login' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setStoreUsername = useClientStore((s) => s.setUsername)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(mode === 'signup')

  useEffect(() => {
    setIsRegistering(mode === 'signup')
  }, [mode])

  useEffect(() => {
    // Initialize admin accounts if they don't exist
    const users = JSON.parse(localStorage.getItem('users') || '{}')
    if (!users['mb08']) {
      users['mb08'] = 'password08'
    }
    if (!users['jt08']) {
      users['jt08'] = 'password08'
    }
    localStorage.setItem('users', JSON.stringify(users))

    // If already logged in, send to /app
    const auth = localStorage.getItem('userAuth')
    if (auth) {
      try {
        const { username: storedUsername, expiry } = JSON.parse(auth)
        if (expiry && Date.now() < expiry && storedUsername) {
          setStoreUsername(storedUsername)
          emailService.setUsername(storedUsername)
          navigate('/app', { replace: true })
        } else {
          localStorage.removeItem('userAuth')
        }
      } catch (e) {
        localStorage.removeItem('userAuth')
      }
    }
  }, [navigate, setStoreUsername])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    if (isRegistering) {
      // Register new user
      const users = JSON.parse(localStorage.getItem('users') || '{}')
      if (users[username]) {
        setError('Username already exists')
        return
      }
      users[username] = password
      localStorage.setItem('users', JSON.stringify(users))
      setIsRegistering(false)
      setError('Registration successful! Please login.')
    } else {
      // Login
      const users = JSON.parse(localStorage.getItem('users') || '{}')
      if (users[username] === password) {
        // Store auth with 7 day expiry
        const auth = {
          username,
          expiry: Date.now() + 7 * 24 * 60 * 60 * 1000
        }
        localStorage.setItem('userAuth', JSON.stringify(auth))
        setStoreUsername(username)
        emailService.setUsername(username)
        const planParam = searchParams.get('plan')
        navigate(planParam ? `/app?plan=${planParam}` : '/app', { replace: true })
      } else {
        setError('Invalid username or password')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      <AnimatedBackground />
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 backdrop-blur-md transition hover:bg-white/40 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
      >
        ← Back to home
      </Link>
      <div className="relative z-10 w-full flex justify-center">
        <GlowCard>
        <div className="w-full max-w-md p-6 md:p-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            {isRegistering ? 'Sign up to access your client tracker' : 'Sign in to access your client tracker'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
              />
            </label>

            {error && (
              <p className={`text-sm ${error.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
              style={{ backgroundColor: `rgb(var(--color-primary))` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary-dark))`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary))`}
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError('')
            }}
            className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
        </GlowCard>
      </div>
    </div>
  )
}
