import { colorThemes, type ColorTheme } from '../lib/colorThemes'

interface ColorThemeSelectorProps {
  currentTheme: ColorTheme
  onThemeChange: (theme: ColorTheme) => void
}

export function ColorThemeSelector({ currentTheme, onThemeChange }: ColorThemeSelectorProps) {
  const themeOptions: { key: ColorTheme; label: string; color: string }[] = [
    { key: 'purple', label: 'Purple', color: 'bg-violet-500' },
    { key: 'green', label: 'Green', color: 'bg-emerald-500' },
    { key: 'red', label: 'Red', color: 'bg-rose-500' },
    { key: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { key: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { key: 'white', label: 'White', color: 'bg-slate-500' },
  ]

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">Color Theme</span>
      <div className="flex flex-wrap gap-2">
        {themeOptions.map((option) => {
          const theme = colorThemes[option.key]
          const isSelected = currentTheme === option.key
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onThemeChange(option.key)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${isSelected
                ? `border-${theme.primary}-500 text-white`
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              style={isSelected ? { backgroundColor: `rgb(${theme.rgb.primary})` } : {}}
              aria-label={`Select ${option.label} theme`}
            >
              <div className={`h-4 w-4 rounded-full ${option.color}`} />
              <span>
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
