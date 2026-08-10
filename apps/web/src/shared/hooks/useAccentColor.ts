import { useCallback, useEffect, useState } from 'react'
import { buildAccentCss, DEFAULT_HUE } from '../lib/accent-theme'

const STORAGE_KEY = 'cf-accent-hue'
const STYLE_ELEMENT_ID = 'cf-accent-style'

function getStoredHue(): number {
  if (typeof window === 'undefined') return DEFAULT_HUE
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return DEFAULT_HUE
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : DEFAULT_HUE
}

function applyHue(hue: number) {
  const existing = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null

  if (hue === DEFAULT_HUE) {
    existing?.remove()
    return
  }

  const styleEl = existing ?? document.createElement('style')
  styleEl.id = STYLE_ELEMENT_ID
  styleEl.textContent = buildAccentCss(hue)
  if (!existing) document.head.appendChild(styleEl)
}

interface UseAccentColorResult {
  hue: number
  setHue: (hue: number) => void
}

/**
 * Unlimited accent color — any hue, not a fixed palette. Injects a
 * generated <style> tag (see accent-theme.ts) rather than toggling a
 * data-attribute against pre-written CSS, since the color space here is
 * open-ended rather than a handful of known presets. index.html's
 * bootstrap script builds the same stylesheet before first paint so
 * there's no flash back to the default hue on load.
 */
export function useAccentColor(): UseAccentColorResult {
  const [hue, setHueState] = useState<number>(getStoredHue)

  useEffect(() => {
    applyHue(hue)
    localStorage.setItem(STORAGE_KEY, String(hue))
  }, [hue])

  const setHue = useCallback((next: number) => setHueState(((next % 360) + 360) % 360), [])

  return { hue, setHue }
}
