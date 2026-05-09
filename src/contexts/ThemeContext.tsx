import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { colorThemes, type ColorTheme } from '../lib/colorThemes'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  colorTheme: ColorTheme
  setTheme: (t: Theme) => void
  setColorTheme: (c: ColorTheme) => void
}

const THEME_KEY = 'rest-theme'
const COLOR_THEME_KEY = 'rest-color-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function readColorTheme(): ColorTheme {
  try {
    const stored = localStorage.getItem(COLOR_THEME_KEY)
    if (stored && stored in colorThemes) return stored as ColorTheme
  } catch {
    // ignore
  }
  return 'blue'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(readColorTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    const selected = colorThemes[colorTheme]
    document.documentElement.style.setProperty('--color-primary', selected.rgb.primary)
    document.documentElement.style.setProperty('--color-primary-light', selected.rgb.primaryLight)
    document.documentElement.style.setProperty('--color-primary-dark', selected.rgb.primaryDark)
    try {
      localStorage.setItem(COLOR_THEME_KEY, colorTheme)
    } catch {
      // ignore
    }
  }, [colorTheme])

  return (
    <ThemeContext.Provider
      value={{ theme, colorTheme, setTheme: setThemeState, setColorTheme: setColorThemeState }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
