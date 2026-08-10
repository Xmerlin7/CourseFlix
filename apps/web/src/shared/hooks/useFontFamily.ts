import { useCallback, useEffect, useState } from 'react'

export const FONT_FAMILIES = ['cairo', 'tajawal', 'almarai', 'ibm-plex', 'noto-kufi'] as const
export type FontFamily = (typeof FONT_FAMILIES)[number]

const STORAGE_KEY = 'cf-font'
const DEFAULT_FONT: FontFamily = 'cairo'

function isFontFamily(value: string | null): value is FontFamily {
  return !!value && (FONT_FAMILIES as readonly string[]).includes(value)
}

function getStoredFont(): FontFamily {
  if (typeof window === 'undefined') return DEFAULT_FONT
  const stored = localStorage.getItem(STORAGE_KEY)
  return isFontFamily(stored) ? stored : DEFAULT_FONT
}

interface UseFontFamilyResult {
  font: FontFamily
  setFont: (font: FontFamily) => void
}

/**
 * Applies a `data-font` attribute on <html> that swaps --font-family
 * (see index.css) — Cairo is the app's default and needs no attribute.
 * The other four are only fetched from Google Fonts once picked; the
 * <link> in index.html already lists all five so there's no extra
 * network request mid-session.
 */
export function useFontFamily(): UseFontFamilyResult {
  const [font, setFontState] = useState<FontFamily>(getStoredFont)

  useEffect(() => {
    if (font === DEFAULT_FONT) {
      document.documentElement.removeAttribute('data-font')
    } else {
      document.documentElement.setAttribute('data-font', font)
    }
    localStorage.setItem(STORAGE_KEY, font)
  }, [font])

  const setFont = useCallback((next: FontFamily) => setFontState(next), [])

  return { font, setFont }
}
