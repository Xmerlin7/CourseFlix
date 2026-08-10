import { useCallback, useEffect, useState } from 'react'

export const UI_SCALES = ['small', 'default', 'large'] as const
export type UiScale = (typeof UI_SCALES)[number]

const STORAGE_KEY = 'cf-ui-scale'
const DEFAULT_SCALE: UiScale = 'default'

function isUiScale(value: string | null): value is UiScale {
  return !!value && (UI_SCALES as readonly string[]).includes(value)
}

function getStoredScale(): UiScale {
  if (typeof window === 'undefined') return DEFAULT_SCALE
  const stored = localStorage.getItem(STORAGE_KEY)
  return isUiScale(stored) ? stored : DEFAULT_SCALE
}

interface UseUiScaleResult {
  scale: UiScale
  setScale: (scale: UiScale) => void
}

/**
 * Applies a `data-ui-scale` attribute on <html> that sets --ui-zoom (see
 * index.css), consumed via the CSS `zoom` property on :root — a real
 * layout-level zoom (same mechanism as the browser's own Ctrl+scroll),
 * not a mechanical per-declaration conversion, so it resizes text and
 * spacing together everywhere with no risk of missed spots.
 */
export function useUiScale(): UseUiScaleResult {
  const [scale, setScaleState] = useState<UiScale>(getStoredScale)

  useEffect(() => {
    if (scale === DEFAULT_SCALE) {
      document.documentElement.removeAttribute('data-ui-scale')
    } else {
      document.documentElement.setAttribute('data-ui-scale', scale)
    }
    localStorage.setItem(STORAGE_KEY, scale)
  }, [scale])

  const setScale = useCallback((next: UiScale) => setScaleState(next), [])

  return { scale, setScale }
}
