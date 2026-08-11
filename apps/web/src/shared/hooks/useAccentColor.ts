import { useCallback, useEffect, useState } from 'react'
import { ACCENT_VAR_NAMES, buildAccentVars, DEFAULT_ACCENT_HEX, isValidHex } from '../lib/accent-theme'

const STORAGE_KEY = 'cf-accent-hex'

function getStoredHex(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_HEX
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && isValidHex(stored) ? stored : DEFAULT_ACCENT_HEX
}

function clearAccentVars() {
  for (const name of ACCENT_VAR_NAMES) {
    document.documentElement.style.removeProperty(`--${name}`)
  }
}

function applyHex(hex: string) {
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
 */
export function useAccentColor(): UseAccentColorResult {
  const [hex, setHexState] = useState<string>(getStoredHex)

  useEffect(() => {
    applyHex(hex)
    localStorage.setItem(STORAGE_KEY, hex)

    if (hex === DEFAULT_ACCENT_HEX) return

    // The values above are a snapshot for whichever theme was active at
    // the moment they were applied — re-run whenever <html>'s class
    // changes (i.e. the user flips light/dark) so the accent follows
    // the theme instead of freezing at whatever mode was active when
    // the color was picked.
    const observer = new MutationObserver(() => applyHex(hex))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [hex])

  const setHex = useCallback((next: string) => {
    if (isValidHex(next)) setHexState(next)
  }, [])

  return { hex, setHex }
}
