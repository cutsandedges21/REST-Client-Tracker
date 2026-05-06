import React, { useState, useEffect } from 'react'
import { GlowCard } from './GlowCard'
import { LiquidAurora } from './LiquidAurora'

export function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

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

    // Check if already logged in
    const auth = localStorage.getItem('userAuth')
    if (auth) {
      try {
        const { username: storedUsername, expiry } = JSON.parse(auth)
        if (expiry && Date.now() < expiry) {
          onLogin(storedUsername)
        } else {
          localStorage.removeItem('userAuth')
        }
      } catch (e) {
        localStorage.removeItem('userAuth')
      }
    }
  }, [onLogin])

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
        onLogin(username)
      } else {
        setError('Invalid username or password')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-[#0a0418]">
      <LiquidAurora />
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
