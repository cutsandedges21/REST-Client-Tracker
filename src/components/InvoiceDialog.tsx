import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { Client } from '../types/client'
import { formatCurrency } from '../lib/finance'
import { serviceFrequencyLabels } from '../lib/labels'
import { DEFAULT_INVOICE_TEMPLATE, buildMailto, fillTemplate } from '../lib/invoice'
import { cn } from '../lib/utils'
import { inputClass, labelClass, ghostButtonClass, primaryButtonClass, primaryButtonStyle } from '../lib/ui'
import { useAuth } from '../contexts/AuthContext'
import { GlowCard } from './GlowCard'

interface InvoiceDialogProps {
  open: boolean
  client: Client | null
  onClose: () => void
  /** Navigate to the invoice-template settings page. */
  onEditTemplate?: () => void
}

const today = () => new Date().toISOString().split('T')[0]

export function InvoiceDialog({ open, client, onClose, onEditTemplate }: InvoiceDialogProps) {
  const { profile } = useAuth()
  const business = profile?.business_name?.trim() || profile?.account_name?.trim() || 'My Lawn Care'
  const template = profile?.invoice_template?.trim() || DEFAULT_INVOICE_TEMPLATE

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [service, setService] = useState('')
  const [date, setDate] = useState(today())
  const [body, setBody] = useState('')
  const [manual, setManual] = useState(false)

  // Initialise fields when a client is opened.
  useEffect(() => {
    if (open && client) {
      setTo(client.email ?? '')
      setAmount(String(client.perCutRate ?? ''))
      setService(`${serviceFrequencyLabels[client.serviceFrequency]} lawn service`)
      setDate(today())
      setManual(false)
    }
  }, [open, client])

  // Regenerate body from the template until the user hand-edits it.
  useEffect(() => {
    if (!open || !client || manual) return
    const amountNum = parseFloat(amount)
    setBody(
      fillTemplate(template, {
        client: client.fullName,
        business,
        service,
        date: new Date(date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
        amount: Number.isFinite(amountNum) ? formatCurrency(amountNum) : '$0.00',
      }),
    )
  }, [open, client, manual, template, business, service, date, amount])

  if (!client) return null

  const send = () => {
    if (!to.trim() || !to.includes('@')) {
      toast.error('Enter a valid recipient email address')
      return
    }
    const subject = `Invoice from ${business}`
    window.location.href = buildMailto(to.trim(), subject, body)
    toast.success('Opening your email app…')
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <GlowCard>
              <div className="max-h-[85vh] overflow-y-auto p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" style={{ color: 'rgb(var(--color-primary))' }} />
                  <h2 className="font-display text-xl font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
                    Invoice {client.fullName}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Fill in the blanks, then send from your own email app. Nothing leaves the device until you hit send.
                </p>

                <div className="mt-5 grid gap-4">
                  <label className="space-y-1.5">
                    <span className={labelClass}>Send to</span>
                    <input
                      className={inputClass}
                      inputMode="email"
                      placeholder="client@email.com"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className={labelClass}>Amount</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        className={inputClass}
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value)
                          setManual(false)
                        }}
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className={labelClass}>Date</span>
                      <input
                        type="date"
                        className={inputClass}
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value)
                          setManual(false)
                        }}
                      />
                    </label>
                  </div>

                  <label className="space-y-1.5">
                    <span className={labelClass}>Service</span>
                    <input
                      className={inputClass}
                      value={service}
                      onChange={(e) => {
                        setService(e.target.value)
                        setManual(false)
                      }}
                    />
                  </label>

                  <label className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={labelClass}>Message</span>
                      {manual && (
                        <button
                          type="button"
                          onClick={() => setManual(false)}
                          className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                        >
                          Reset to template
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={9}
                      className={cn(inputClass, 'resize-none font-sans leading-relaxed')}
                      value={body}
                      onChange={(e) => {
                        setBody(e.target.value)
                        setManual(true)
                      }}
                    />
                  </label>

                  {onEditTemplate && (
                    <p className="text-xs text-slate-500">
                      Want a different default?{' '}
                      <button
                        type="button"
                        onClick={onEditTemplate}
                        className="font-medium underline underline-offset-2"
                        style={{ color: 'rgb(var(--color-primary-dark))' }}
                      >
                        Edit your saved template
                      </button>
                      .
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={onClose} className={ghostButtonClass}>
                    Cancel
                  </button>
                  <button type="button" onClick={send} className={primaryButtonClass} style={primaryButtonStyle}>
                    <Send className="h-4 w-4" />
                    Open in email app
                  </button>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
