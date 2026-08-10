import { useCallback, useEffect, useState } from 'react'

export const ACCENT_COLORS = ['violet', 'blue', 'teal', 'amber', 'rose'] as const
export type AccentColor = (typeof ACCENT_COLORS)[number]

const STORAGE_KEY = 'cf-accent'
const DEFAULT_ACCENT: AccentColor = 'violet'

function isAccentColor(value: string | null): value is AccentColor {
  return !!value && (ACCENT_COLORS as readonly string[]).includes(value)
}

function getStoredAccent(): AccentColor {
  if (typeof window === 'undefined') return DEFAULT_ACCENT
  const stored = localStorage.getItem(STORAGE_KEY)
  return isAccentColor(stored) ? stored : DEFAULT_ACCENT
}

interface UseAccentColorResult {
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
}

/**
 * Applies a `data-accent` attribute on <html> that a matching CSS block
 * (see index.css) uses to swap --primary/--on-primary/--primary-container/
 * --on-primary-container/--nav-active/--logo. 'violet' is the app's
 * original palette and needs no attribute at all — see index.html's
 * bootstrap script for the pre-paint equivalent of this effect.
 */
export function useAccentColor(): UseAccentColorResult {
  const [accent, setAccentState] = useState<AccentColor>(getStoredAccent)

  useEffect(() => {
    if (accent === DEFAULT_ACCENT) {
      document.documentElement.removeAttribute('data-accent')
    } else {
      document.documentElement.setAttribute('data-accent', accent)
    }
    localStorage.setItem(STORAGE_KEY, accent)
  }, [accent])

  const setAccent = useCallback((next: AccentColor) => setAccentState(next), [])

  return { accent, setAccent }
}
