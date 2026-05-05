import React, { useState, useEffect } from 'react'
import { GlowCard } from './GlowCard'

export function EmailAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [publicKey, setPublicKey] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [clientEditTemplateId, setClientEditTemplateId] = useState('')

  useEffect(() => {
    const savedConfig = localStorage.getItem('emailjsConfig')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setPublicKey(config.publicKey || '')
        setServiceId(config.serviceId || '')
        setTemplateId(config.templateId || '')
        setClientEditTemplateId(config.clientEditTemplateId || '')
        setIsAuthenticated(!!config.publicKey && !!config.serviceId && !!config.templateId)
      } catch (error) {
        console.error('Error parsing EmailJS config:', error)
      }
    }
  }, [])

  const handleSave = () => {
    if (publicKey && serviceId && templateId) {
      const config = { publicKey, serviceId, templateId, clientEditTemplateId }
      localStorage.setItem('emailjsConfig', JSON.stringify(config))
      setIsAuthenticated(true)
      alert('EmailJS configured successfully!')
    } else {
      alert('Please fill in all required fields')
    }
  }

  const handleClear = () => {
    localStorage.removeItem('emailjsConfig')
    setPublicKey('')
    setServiceId('')
    setTemplateId('')
    setClientEditTemplateId('')
    setIsAuthenticated(false)
    alert('Configuration cleared')
  }

  return (
    <GlowCard>
      <div className="p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>Email Configuration</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" style={{ color: `rgb(var(--color-primary))` }}>EmailJS</a> to recieve confirmation emails.
        </p>

        <div className="mt-5 space-y-4">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">EmailJS Public Key</span>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              placeholder="Your EmailJS public key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
          </label>

          <br></br>
          <br></br>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Service ID</span>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              placeholder="Your EmailJS service ID"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            />
          </label>

          <br></br>
          <br></br>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Template ID (for client notifications)</span>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              placeholder="Your EmailJS template ID"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            />
          </label>

          <br></br>
          <br></br>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Client Edit Template ID (optional - for client updates)</span>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              placeholder="Your client edit template ID (optional)"
              value={clientEditTemplateId}
              onChange={(e) => setClientEditTemplateId(e.target.value)}
            />
            <br></br>
            <br></br>

          </label>

          {isAuthenticated && (
            <p className="text-sm text-slate-600">
              EmailJS is configured and ready to send emails!
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
              style={{ backgroundColor: `rgb(var(--color-primary))` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary-dark))`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary))`}
            >
              Save Configuration
            </button>
            {isAuthenticated && (
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
