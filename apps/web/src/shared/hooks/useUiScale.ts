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
 * Applies a `data-ui-scale` attribute on <html>, which index.css's
 * [data-ui-scale] rules read to set --ui-zoom — consumed by `.sidebar`
 * and `.sheet`'s own `zoom: var(--ui-zoom)`, not by :root. Zooming the
 * whole page (as an earlier version did) scaled everything at once —
 * including position:fixed overlays (toasts, the floating assistant)
 * sized against a real viewport whose own dimensions hadn't moved,
 * which is what made elements overflow/vanish at 115%. Scoping the zoom
 * to the sidebar and content sheet individually keeps their own boxes a
 * stable size (each already contained: height:100% of an already-100vh
 * ancestor, plus overflow handling of their own) while what's rendered
 * inside them grows/shrinks — see the comments on `.sidebar`/`.sheet`
 * in index.css.
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
