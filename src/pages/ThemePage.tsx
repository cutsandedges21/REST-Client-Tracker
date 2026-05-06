import { Moon, Sun } from 'lucide-react'
import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { ColorThemeSelector } from '../components/ColorThemeSelector'
import { type ColorTheme } from '../lib/colorThemes'

type ThemePageProps = {
  theme: 'light' | 'dark'
  colorTheme: ColorTheme
  onThemeChange: (theme: 'light' | 'dark') => void
  onColorThemeChange: (theme: ColorTheme) => void
  onBack: () => void
}

export function ThemePage({
  theme,
  colorTheme,
  onThemeChange,
  onColorThemeChange,
  onBack,
}: ThemePageProps) {
  return (
    <SettingsPage title="Theme" onBack={onBack}>
      <GlowCard>
        <div className="flex flex-col gap-5 p-5 md:p-6">
          <div>
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ color: `rgb(var(--color-primary-dark))` }}
            >
              Appearance
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Toggle between light and dark mode.
            </p>
            <button
              type="button"
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <ColorThemeSelector currentTheme={colorTheme} onThemeChange={onColorThemeChange} />
          </div>
        </div>
      </GlowCard>
    </SettingsPage>
  )
}
