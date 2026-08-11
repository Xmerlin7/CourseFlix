import { useCallback, useEffect, useState } from 'react'
import { ACCENT_VAR_NAMES, buildAccentVars, DEFAULT_ACCENT_HEX, isValidHex } from '../lib/accent-theme'

export const ACCENT_STORAGE_KEY = 'cf-accent-hex'

export function getStoredAccentHex(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_HEX
  const stored = localStorage.getItem(ACCENT_STORAGE_KEY)
  return stored && isValidHex(stored) ? stored : DEFAULT_ACCENT_HEX
}

function clearAccentVars() {
  for (const name of ACCENT_VAR_NAMES) {
    document.documentElement.style.removeProperty(`--${name}`)
  }
}

// Exported (not just used internally) — useAccentThemeSync calls this
// same function from the app root so the accent stays correct for
// whichever mode is active even when Settings > Appearance isn't
// mounted at all.
export function applyAccentHex(hex: string) {
  if (hex === DEFAULT_ACCENT_HEX) {
    clearAccentVars()
    return
  }

  const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  const vars = buildAccentVars(hex, mode)
  for (const [name, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(`--${name}`, value, 'important')
  }
}

interface UseAccentColorResult {
  hex: string
  setHex: (hex: string) => void
}

/**
 * Unlimited accent color — any hex the user picks, not a fixed palette,
 * and the whole color (hue + saturation + lightness) is used, not just
 * its hue — see accent-theme.ts's buildAccentVars. Applies via
 * `style.setProperty(..., 'important')` directly on <html> rather than
 * injecting a <style> tag: an inline style has no selector, so there's
 * no specificity/layer/DOM-order contest to lose against index.css's
 * own default `:root`/`:root.dark` tokens — it always wins, in both
 * themes, regardless of load timing. index.html's bootstrap script does
 * the same thing before first paint so there's no flash back to the
 * default color on load.
 *
 * This hook only re-applies when `hex` itself changes (i.e. the user
 * picks a new color) — keeping the applied values in sync with the
 * CURRENT theme afterward is useAccentThemeSync's job, mounted once at
 * the app root, since this hook (and its component) is only mounted
 * while Settings > Appearance's tab happens to be open.
 */
export function useAccentColor(): UseAccentColorResult {
  const [hex, setHexState] = useState<string>(getStoredAccentHex)

  useEffect(() => {
    applyAccentHex(hex)
    localStorage.setItem(ACCENT_STORAGE_KEY, hex)
  }, [hex])

  const setHex = useCallback((next: string) => {
    if (isValidHex(next)) setHexState(next)
  }, [])

  return { hex, setHex }
}
