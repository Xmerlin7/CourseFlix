import { useCallback, useEffect, useState } from 'react'
import { buildAccentCss, DEFAULT_ACCENT_HEX, isValidHex } from '../lib/accent-theme'

const STORAGE_KEY = 'cf-accent-hex'
const STYLE_ELEMENT_ID = 'cf-accent-style'

function getStoredHex(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_HEX
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && isValidHex(stored) ? stored : DEFAULT_ACCENT_HEX
}

function applyHex(hex: string) {
  const existing = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null

  if (hex === DEFAULT_ACCENT_HEX) {
    existing?.remove()
    return
  }

  const styleEl = existing ?? document.createElement('style')
  styleEl.id = STYLE_ELEMENT_ID
  styleEl.textContent = buildAccentCss(hex)
  if (!existing) document.head.appendChild(styleEl)
}

interface UseAccentColorResult {
  hex: string
  setHex: (hex: string) => void
}

/**
 * Unlimited accent color — any hex the user picks, not a fixed palette,
 * and the whole color (hue + saturation + lightness) is used, not just
 * its hue — see accent-theme.ts's color-mix()-based generation. Injects
 * a generated <style> tag rather than toggling a data-attribute against
 * pre-written CSS, since the color space here is open-ended.
 * index.html's bootstrap script builds the same stylesheet before first
 * paint so there's no flash back to the default color on load.
 */
export function useAccentColor(): UseAccentColorResult {
  const [hex, setHexState] = useState<string>(getStoredHex)

  useEffect(() => {
    applyHex(hex)
    localStorage.setItem(STORAGE_KEY, hex)
  }, [hex])

  const setHex = useCallback((next: string) => {
    if (isValidHex(next)) setHexState(next)
  }, [])

  return { hex, setHex }
}
