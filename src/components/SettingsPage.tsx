import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { GlowCard } from './GlowCard'

type SettingsPageProps = {
  title: string
  onBack: () => void
  children: ReactNode
}

export function SettingsPage({ title, onBack, children }: SettingsPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <GlowCard>
        <div className="flex items-center gap-3 p-5 md:p-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 transition hover:bg-slate-100"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: `rgb(var(--color-primary-dark))` }}
          >
            {title}
          </h1>
        </div>
      </GlowCard>

      {children}
    </div>
  )
}
