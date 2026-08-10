import { useCallback, useEffect, useState } from 'react'

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

interface UseThemeResult {
  mode: ThemeMode
  // The actual light/dark applied to the page — same as `mode` unless
  // mode is 'system', in which case this tracks the OS preference.
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

/**
 * Single source of truth for the app's light/dark class on <html>, shared
 * by the Topbar's quick toggle and Settings > Appearance's 3-way picker.
 * Applies and persists to localStorage immediately (so there's no flash
 * while a Settings > Appearance save round-trips to the API) — callers
 * that want the choice synced to the account PATCH it separately.
 */
export function useTheme(): UseThemeResult {
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

  return { mode, resolvedTheme, setMode }
}
