'use client'

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const THEME_CHANGE_EVENT = 'basvuru-pusulasi-theme-change'

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
})

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function getServerThemeSnapshot(): Theme {
  return 'dark'
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback)
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback)
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot)
  const setTheme = useCallback((nextTheme: Theme) => applyTheme(nextTheme), [])
  const toggleTheme = useCallback(
    () => applyTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme]
  )

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
