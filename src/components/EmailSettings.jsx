import React, { useState, useEffect } from 'react'
import { GlowCard } from './GlowCard'

export function EmailSettings() {
  const [email, setEmail] = useState('')
  const [savedEmail, setSavedEmail] = useState('')

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail')
    if (storedEmail) {
      setEmail(storedEmail)
      setSavedEmail(storedEmail)
    }
  }, [])

  const handleSave = () => {
    if (email && email.includes('@')) {
      localStorage.setItem('userEmail', email)
      setSavedEmail(email)
      alert('Email saved successfully!')
    } else {
      alert('Please enter a valid email address')
    }
  }

  const handleClear = () => {
    localStorage.removeItem('userEmail')
    setEmail('')
    setSavedEmail('')
    alert('Email cleared')
  }

  return (
    <GlowCard>
      <div className="p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>Email Settings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure your email address to receive client notifications and reminders.
        </p>


        <div className="mt-5 space-y-4">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Your Email Address</span>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <br></br>
            <br></br>
          </label>

          {savedEmail && (
            <p className="text-sm text-slate-600">
              Current saved email: <span className="font-medium" style={{ color: `rgb(var(--color-primary-dark))` }}>{savedEmail}</span>
              <br></br>
              <br></br>
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
              style={{ backgroundColor: `var(--color-primary)` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary-dark)`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary)`}
            >
              Save Email
            </button>
            {savedEmail && (
              <button
                onClick={handleClear}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </GlowCard>
  )
}