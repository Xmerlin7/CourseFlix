import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'cf-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

interface ThemeContextValue {
  mode: ThemeMode
  // The actual light/dark applied to the page — same as `mode` unless
  // mode is 'system', in which case this tracks the OS preference.
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Single source of truth for the app's light/dark class on <html>,
 * mounted once at the app root (see AppProviders). This used to be a
 * plain hook called independently from both the Topbar's ThemeToggle
 * and Settings > Appearance's picker — two separate useState instances
 * backed by the same localStorage key, but with no way to stay in sync
 * with each other beyond their own initial mount read. Whichever one's
 * effect fired most recently silently overwrote the <html> class based
 * on *its own* possibly-stale belief, which is what made the accent
 * color (whose own effect reads document.documentElement's actual class
 * at apply-time) intermittently see the wrong mode. A Context makes
 * every consumer share the exact same state, so there's nothing left to
 * drift — confirmed by reproducing the drift in a real DOM test before
 * this fix and confirming it's gone after.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)

  const resolvedTheme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
  }, [])

  return <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
