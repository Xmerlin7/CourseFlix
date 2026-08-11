import { useCallback, useEffect, useState } from 'react'

export const UI_SCALES = ['small', 'default', 'large'] as const
export type UiScale = (typeof UI_SCALES)[number]

const STORAGE_KEY = 'cf-ui-scale'
const DEFAULT_SCALE: UiScale = 'default'

const ZOOM_BY_SCALE: Record<UiScale, string> = {
  small: '0.9',
  default: '1',
  large: '1.15',
}

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
 * Applies a `data-ui-scale` attribute on <html> (which index.css's
 * [data-ui-scale] rules read to set --ui-zoom) AND sets the same zoom
 * directly as an inline style — belt and suspenders. `zoom` is a real
 * layout-level scale (same mechanism as the browser's own Ctrl+scroll),
 * but it's less common than the other properties this app depends on, so
 * this doesn't rely solely on the value surviving the CSS build pipeline
 * inside a stylesheet — style.zoom is set straight on the element via
 * the CSSOM, independent of any stylesheet processing.
 */
export function useUiScale(): UseUiScaleResult {
  const [scale, setScaleState] = useState<UiScale>(getStoredScale)

  useEffect(() => {
    if (scale === DEFAULT_SCALE) {
      document.documentElement.removeAttribute('data-ui-scale')
    } else {
      document.documentElement.setAttribute('data-ui-scale', scale)
    }
    // `zoom` isn't in the standard CSSStyleDeclaration TS types yet.
    ;(document.documentElement.style as CSSStyleDeclaration & { zoom: string }).zoom =
      ZOOM_BY_SCALE[scale]
    localStorage.setItem(STORAGE_KEY, scale)
  }, [scale])

  const setScale = useCallback((next: UiScale) => setScaleState(next), [])

  return { scale, setScale }
}
