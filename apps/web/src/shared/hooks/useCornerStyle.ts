import { useCallback, useEffect, useState } from 'react'

export const CORNER_STYLES = ['sharp', 'default', 'round'] as const
export type CornerStyle = (typeof CORNER_STYLES)[number]

const STORAGE_KEY = 'cf-corners'
const DEFAULT_CORNERS: CornerStyle = 'default'

function isCornerStyle(value: string | null): value is CornerStyle {
  return !!value && (CORNER_STYLES as readonly string[]).includes(value)
}

function getStoredCorners(): CornerStyle {
  if (typeof window === 'undefined') return DEFAULT_CORNERS
  const stored = localStorage.getItem(STORAGE_KEY)
  return isCornerStyle(stored) ? stored : DEFAULT_CORNERS
}

interface UseCornerStyleResult {
  corners: CornerStyle
  setCorners: (corners: CornerStyle) => void
}

/**
 * Applies a `data-corners` attribute on <html> that scales the
 * --radius-scale token (see index.css) consumed by rectangular surfaces —
 * cards, inputs, dialogs. Pill/circular chrome (buttons, chips, avatars,
 * the Switch) is intentionally excluded: scaling an already-999px radius
 * is a no-op, and un-rounding a toggle switch would break its affordance.
 */
export function useCornerStyle(): UseCornerStyleResult {
  const [corners, setCornersState] = useState<CornerStyle>(getStoredCorners)

  useEffect(() => {
    if (corners === DEFAULT_CORNERS) {
      document.documentElement.removeAttribute('data-corners')
    } else {
      document.documentElement.setAttribute('data-corners', corners)
    }
    localStorage.setItem(STORAGE_KEY, corners)
  }, [corners])

  const setCorners = useCallback((next: CornerStyle) => setCornersState(next), [])

  return { corners, setCorners }
}
