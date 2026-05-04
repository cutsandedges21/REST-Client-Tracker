import React, { useState } from 'react'
import ReactDOMServer from 'react-dom/server'
import { Email } from './Email'
import { GlowCard } from './GlowCard'
import { emailService } from '../services/emailService.js'

export function EmailPreview({ clients, appointments }) {
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState('')
  const [emailType, setEmailType] = useState('reminder')
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)

  const client = clients.find(c => c.id === selectedClient)
  const appointment = appointments.find(a => a.id === selectedAppointment)

  const handleSendTestEmail = async () => {
    if (!client) {
      alert('Please select a client first')
      return
    }

    setIsSending(true)
    setSendResult(null)

    try {
      const result = await emailService.sendEmail({
        type: emailType,
        client,
        appointment
      })

      setSendResult({
        success: result.success,
        message: result.success ? 'Test email sent successfully!' : `Failed: ${result.error}`
      })
    } catch (error) {
      setSendResult({
        success: false,
        message: `Error: ${error.message}`
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <GlowCard>
      <div className="p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>Email Preview</h2>
        <p className="mt-1 text-sm text-slate-600">
          Preview how your emails will look before sending or receiving them.
        </p>

        <div className="mt-5 space-y-4 grid gap-4">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Email Type</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
            >
              <option value="reminder">Reminder (30 minutes)</option>
              <option value="newClient">New Client Added</option>
              <option value="clientEdit">Client Updated</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Select Client</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Choose a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </label>

          {emailType === 'reminder' && (
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Select Appointment</span>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
              >
                <option value="">Choose an appointment...</option>
                {appointments
                  .filter(a => a.clientId === selectedClient)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.date} at {a.time}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {client && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div dangerouslySetInnerHTML={{
                __html: ReactDOMServer.renderToStaticMarkup(
                  <Email
                    type={emailType}
                    client={client}
                    appointment={appointment}
                  />
                )
              }} />
            </div>
          )}

          {client && (
            <button
              onClick={handleSendTestEmail}
              disabled={isSending}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: `var(--color-primary)` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary-dark)`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary)`}
            >
              {isSending ? 'Sending...' : 'Send Test Email'}
            </button>
          )}

          {sendResult && (
            <div className={`rounded-lg p-3 ${sendResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {sendResult.message}
            </div>
          )}
        </div>
      </div>
    </GlowCard>
  )
}