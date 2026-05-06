import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings, Palette, Mail, User } from 'lucide-react'

export type SettingsView = 'main' | 'theme' | 'email' | 'account'

type SettingsGearProps = {
  currentView: SettingsView
  onNavigate: (view: SettingsView) => void
}

type PanelOption = {
  view: Exclude<SettingsView, 'main'>
  label: string
  Icon: typeof Settings
}

const PANEL_OPTIONS: PanelOption[] = [
  { view: 'theme', label: 'Theme', Icon: Palette },
  { view: 'email', label: 'Email', Icon: Mail },
  { view: 'account', label: 'Account', Icon: User },
]

export function SettingsGear({ currentView, onNavigate }: SettingsGearProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [spinKey, setSpinKey] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close the panel on outside click
  useEffect(() => {
    if (!panelOpen) return
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [panelOpen])

  const handleGearClick = () => {
    setSpinKey((k) => k + 1)
    if (currentView !== 'main') {
      onNavigate('main')
      setPanelOpen(false)
      return
    }
    setPanelOpen((open) => !open)
  }

  const handleOptionClick = (view: Exclude<SettingsView, 'main'>) => {
    onNavigate(view)
    setPanelOpen(false)
  }

  return (
    <div ref={wrapperRef} className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {panelOpen && currentView === 'main' && (
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-14 left-0 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <ul className="flex flex-col py-1">
              {PANEL_OPTIONS.map(({ view, label, Icon }) => (
                <li key={view}>
                  <button
                    type="button"
                    onClick={() => handleOptionClick(view)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Icon className="h-4 w-4" style={{ color: `rgb(var(--color-primary))` }} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleGearClick}
        aria-label="Open settings"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white shadow-md transition hover:bg-slate-50"
        style={{ color: `rgb(var(--color-primary-dark))` }}
      >
        <motion.span
          key={spinKey}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex"
        >
          <Settings className="h-5 w-5" />
        </motion.span>
      </button>
    </div>
  )
}
