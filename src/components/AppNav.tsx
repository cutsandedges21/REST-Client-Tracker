import { CalendarDays, Home, Menu, Route, Users } from 'lucide-react'

export type AppTab = 'home' | 'clients' | 'route' | 'schedule' | 'more'

const ITEMS: { tab: AppTab; label: string; Icon: typeof Home }[] = [
  { tab: 'home', label: 'Home', Icon: Home },
  { tab: 'clients', label: 'Clients', Icon: Users },
  { tab: 'route', label: 'Route', Icon: Route },
  { tab: 'schedule', label: 'Schedule', Icon: CalendarDays },
  { tab: 'more', label: 'More', Icon: Menu },
]

interface AppNavProps {
  active: AppTab
  onChange: (tab: AppTab) => void
  variant: 'top' | 'bottom'
}

export function AppNav({ active, onChange, variant }: AppNavProps) {
  if (variant === 'top') {
    return (
      <nav className="hidden md:flex">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#18181b]/70">
          {ITEMS.map(({ tab, label, Icon }) => {
            const isActive = active === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onChange(tab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
                style={isActive ? { backgroundColor: 'rgb(var(--color-primary))' } : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/85 backdrop-blur-lg dark:border-white/10 dark:bg-[#0f0f12]/95 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-safe">
        {ITEMS.map(({ tab, label, Icon }) => {
          const isActive = active === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition"
              style={{ color: isActive ? 'rgb(var(--color-primary))' : '#94a3b8' }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className="grid h-9 w-12 place-items-center rounded-xl transition"
                style={isActive ? { backgroundColor: 'rgba(var(--color-primary-light), 0.9)' } : undefined}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
