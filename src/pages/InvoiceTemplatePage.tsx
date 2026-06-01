import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { DEFAULT_INVOICE_TEMPLATE, INVOICE_PLACEHOLDERS, fillTemplate, renderInvoiceHtml, rgbStringToHex } from '../lib/invoice'
import { inputClass, labelClass, ghostButtonClass, primaryButtonClass, primaryButtonStyle } from '../lib/ui'
import { cn } from '../lib/utils'
import { updateProfileInvoiceSettings } from '../lib/api'
import { colorThemes } from '../lib/colorThemes'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

type InvoiceTemplatePageProps = {
  onBack: () => void
}

export function InvoiceTemplatePage({ onBack }: InvoiceTemplatePageProps) {
  const { user, profile, refreshProfile } = useAuth()
  const { colorTheme } = useTheme()
  const [businessName, setBusinessName] = useState(profile?.business_name ?? 'Mossimo Bianco')
  const [template, setTemplate] = useState(profile?.invoice_template ?? DEFAULT_INVOICE_TEMPLATE)
  const [accentColor, setAccentColor] = useState<string>(
    () => profile?.invoice_accent_color ?? rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark),
  )
  const [saving, setSaving] = useState(false)

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const previewHtml = useMemo(
    () =>
      renderInvoiceHtml({
        businessName: businessName.trim() || 'Mossimo Bianco',
        clientName: 'Alex Johnson',
        amount: '$50.00',
        date: today,
        message: fillTemplate(template, {
          client: 'Alex Johnson',
          business: businessName.trim() || 'Mossimo Bianco',
          date: today,
          amount: '$50.00',
        }),
        accentDark: accentColor,
      }),
    [businessName, template, accentColor, today],
  )

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateProfileInvoiceSettings(user.id, {
        businessName: businessName.trim() || null,
        invoiceTemplate: template.trim() || null,
        invoiceAccentColor: accentColor,
      })
      await refreshProfile()
      toast.success('Invoice settings saved')
    } catch {
      toast.error('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsPage title="Invoices" onBack={onBack}>
      <GlowCard>
        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
              Invoice defaults
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Set your business name, header colour, and the default message used when you invoice a client.
            </p>
          </div>

          <label className="space-y-1.5">
            <span className={labelClass}>Business name</span>
            <input
              className={inputClass}
              placeholder="e.g. Jordan's Lawn Care"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Email header colour</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
              />
              <span className="font-mono text-sm text-slate-500">{accentColor}</span>
              <button
                type="button"
                onClick={() => setAccentColor(rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark))}
                className={ghostButtonClass}
              >
                Reset to theme
              </button>
            </div>
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Default invoice message</span>
            <textarea
              rows={12}
              className={cn(inputClass, 'resize-y leading-relaxed')}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
          </label>

          <div className="space-y-1.5">
            <span className={labelClass}>Preview</span>
            <p className="text-xs text-slate-500">
              Sample data — your client's real details will fill in when you send.
            </p>
            <iframe
              title="Invoice email preview"
              srcDoc={previewHtml}
              sandbox=""
              className="h-80 w-full rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Placeholders (auto-filled when you send):</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INVOICE_PLACEHOLDERS.map((p) => (
                <code
                  key={p}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                  style={{ color: 'rgb(var(--color-primary-dark))' }}
                >
                  {p}
                </code>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTemplate(DEFAULT_INVOICE_TEMPLATE)}
              className={ghostButtonClass}
            >
              Reset to default
            </button>
            <button type="button" onClick={save} disabled={saving} className={primaryButtonClass} style={primaryButtonStyle}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </GlowCard>
    </SettingsPage>
  )
}
