import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { Client } from '../types/client'
import { formatCurrency } from '../lib/finance'
import { serviceFrequencyLabels } from '../lib/labels'
import {
  DEFAULT_INVOICE_TEMPLATE,
  buildMailto,
  fillTemplate,
  renderInvoiceHtml,
  rgbStringToHex,
} from '../lib/invoice'
import { sendInvoiceEmail } from '../lib/invoiceEmail'
import { colorThemes } from '../lib/colorThemes'
import { cn } from '../lib/utils'
import { inputClass, labelClass, ghostButtonClass, primaryButtonClass, primaryButtonStyle } from '../lib/ui'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { GlowCard } from './GlowCard'

interface InvoiceDialogProps {
  open: boolean
  client: Client | null
  onClose: () => void
  /** Navigate to the invoice-template settings page. */
  onEditTemplate?: () => void
}

const today = () => new Date().toISOString().split('T')[0]
const longDate = (d: string) =>
  new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

export function InvoiceDialog({ open, client, onClose, onEditTemplate }: InvoiceDialogProps) {
  const { profile, user } = useAuth()
  const { colorTheme } = useTheme()
  const business = profile?.business_name?.trim() || profile?.account_name?.trim() || 'My Lawn Care'
  const template = profile?.invoice_template?.trim() || DEFAULT_INVOICE_TEMPLATE
  const accentDark =
    profile?.invoice_accent_color ??
    rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark)

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [service, setService] = useState('')
  const [date, setDate] = useState(today())
  const [message, setMessage] = useState('')
  const [manual, setManual] = useState(false)
  const [sending, setSending] = useState(false)

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

  const amountNum = parseFloat(amount)
  const amountText = Number.isFinite(amountNum) ? formatCurrency(amountNum) : '$0.00'

  // Regenerate the message blurb from the template until the user hand-edits it.
  useEffect(() => {
    if (!open || !client || manual) return
    setMessage(
      fillTemplate(template, {
        client: client.fullName,
        business,
        service,
        date: longDate(date),
        amount: amountText,
      }),
    )
  }, [open, client, manual, template, business, service, date, amountText])

  const html = useMemo(
    () =>
      client
        ? renderInvoiceHtml({
            businessName: business,
            clientName: client.fullName,
            amount: amountText,
            service,
            date: longDate(date),
            message,
            accentDark,
            replyTo: user?.email ?? undefined,
          })
        : '',
    [client, business, amountText, service, date, message, accentDark, user?.email],
  )

  if (!client) return null

  const subject = `Invoice from ${business}`

  const send = async () => {
    if (!to.trim() || !to.includes('@')) {
      toast.error('Enter a valid recipient email address')
      return
    }
    setSending(true)
    try {
      await sendInvoiceEmail({ to: to.trim(), subject, html, replyTo: user?.email ?? undefined })
      toast.success('Invoice sent ✉️')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the invoice')
    } finally {
      setSending(false)
    }
  }

  const openInEmailApp = () => {
    if (!to.trim() || !to.includes('@')) {
      toast.error('Enter a valid recipient email address')
      return
    }
    window.location.href = buildMailto(to.trim(), subject, message)
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <GlowCard>
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" style={{ color: 'rgb(var(--color-primary))' }} />
                    <h2 className="font-display text-xl font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
                      Invoice {client.fullName}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Fill in the details, preview the styled invoice, then send it straight to your client.
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
                        rows={5}
                        className={cn(inputClass, 'resize-none font-sans leading-relaxed')}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value)
                          setManual(true)
                        }}
                      />
                    </label>

                    <div className="space-y-1.5">
                      <span className={labelClass}>Preview</span>
                      <iframe
                        title="Invoice preview"
                        srcDoc={html}
                        sandbox=""
                        className="h-72 w-full rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    {onEditTemplate && (
                      <p className="text-xs text-slate-500">
                        Set your business name & default message under{' '}
                        <button
                          type="button"
                          onClick={onEditTemplate}
                          className="font-medium underline underline-offset-2"
                          style={{ color: 'rgb(var(--color-primary-dark))' }}
                        >
                          Invoice settings
                        </button>
                        .
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                    <button type="button" onClick={onClose} className={ghostButtonClass}>
                      Cancel
                    </button>
                    <button type="button" onClick={openInEmailApp} className={ghostButtonClass}>
                      Open in email app
                    </button>
                    <button
                      type="button"
                      onClick={send}
                      disabled={sending}
                      className={primaryButtonClass}
                      style={primaryButtonStyle}
                    >
                      <Send className="h-4 w-4" />
                      {sending ? 'Sending…' : 'Send invoice'}
                    </button>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
