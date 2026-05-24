import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { Settings, Palette, Mail, User, CreditCard } from 'lucide-react'
import { getPlan, type PlanId } from '../lib/plans'

export type SettingsView = 'main' | 'theme' | 'email' | 'account' | 'upgrade'

type SettingsGearProps = {
  currentView: SettingsView
  onNavigate: (view: SettingsView) => void
  plan: PlanId
  username: string | null
  accountName?: string | null
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
  { view: 'upgrade', label: 'Upgrade', Icon: CreditCard },
]

export function SettingsGear({ currentView, onNavigate, plan, username, accountName }: SettingsGearProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const desktopSpinControls = useAnimationControls()
  const mobileSpinControls = useAnimationControls()

  const planName = getPlan(plan).name
  const trimmedName = accountName?.trim()
  const userLabel = trimmedName ? trimmedName : username ? `@${username}` : ''
  const showExpandedDesktop = hovered || panelOpen

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

  const triggerSpin = () => {
    desktopSpinControls.set({ rotate: 0 })
    mobileSpinControls.set({ rotate: 0 })
    void desktopSpinControls.start({
      rotate: 360,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    })
    void mobileSpinControls.start({
      rotate: 360,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    })
  }

  const handleGearClick = () => {
    triggerSpin()
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
    <div
      ref={wrapperRef}
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Mobile-only persistent chip above the gear */}
      <div
        className="pointer-events-none absolute -top-12 left-0 flex flex-col items-start whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 shadow-sm md:hidden"
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: `rgb(var(--color-primary-dark))` }}
        >
          {planName} Tier
        </span>
        {userLabel && (
          <span className="text-[10px] font-medium text-slate-600 leading-tight">{userLabel}</span>
        )}
      </div>

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

      {/* Desktop: hover-expand pill. Mobile: plain circle (chip is rendered above). */}
      <motion.button
        type="button"
        onClick={handleGearClick}
        aria-label="Open settings"
        layout
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="hidden h-12 items-center overflow-hidden rounded-full border border-slate-300 bg-white shadow-md transition hover:bg-slate-50 md:inline-flex"
        style={{ color: `rgb(var(--color-primary-dark))` }}
      >
        {/* Fixed-size icon container — gear stays centered regardless of label state */}
        <span className="grid h-12 w-12 shrink-0 place-items-center">
          <motion.span
            animate={desktopSpinControls}
            initial={{ rotate: 0 }}
            className="flex h-5 w-5 items-center justify-center"
          >
            <Settings className="h-5 w-5" />
          </motion.span>
        </span>
        <AnimatePresence initial={false}>
          {showExpandedDesktop && (
            <motion.span
              key="label"
              layout
              initial={{ opacity: 0, width: 0, marginRight: 0 }}
              animate={{ opacity: 1, width: 'auto', marginRight: 16 }}
              exit={{ opacity: 0, width: 0, marginRight: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs font-semibold"
            >
              <span
                className="uppercase tracking-[0.14em]"
                style={{ color: `rgb(var(--color-primary-dark))` }}
              >
                {planName} Tier
              </span>
              {userLabel && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-600">{userLabel}</span>
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile: plain circular gear button */}
      <button
        type="button"
        onClick={handleGearClick}
        aria-label="Open settings"
        className="grid h-12 w-12 place-items-center rounded-full border border-slate-300 bg-white shadow-md transition hover:bg-slate-50 md:hidden"
        style={{ color: `rgb(var(--color-primary-dark))` }}
      >
        <motion.span
          animate={mobileSpinControls}
          initial={{ rotate: 0 }}
          className="flex h-5 w-5 items-center justify-center"
        >
          <Settings className="h-5 w-5" />
        </motion.span>
      </button>
    </div>
  )
}
