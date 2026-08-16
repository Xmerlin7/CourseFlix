import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cf-sidebar-position'
// Same-tab only, for the same reason useSidebarCollapsed needs one:
// localStorage's own 'storage' event never fires in the tab that wrote the
// value, so this is what keeps every mounted hook instance (the Sidebar's
// and any future Settings control's) in sync when one of them changes it.
const CHANGE_EVENT = 'cf-sidebar-position-change'

export const SIDEBAR_POSITIONS = ['right', 'left', 'bottom'] as const
export type SidebarPosition = (typeof SIDEBAR_POSITIONS)[number]

// Physical, not logical (start/end). The user drags the bar to a side of
// their screen, so "right" has to mean the right of the screen no matter
// which way the document reads — and this document is RTL, where the
// inline-start edge *is* the right one.
const DEFAULT_POSITION: SidebarPosition = 'right'

function isPosition(value: string | null): value is SidebarPosition {
  return SIDEBAR_POSITIONS.includes(value as SidebarPosition)
}

function getStored(): SidebarPosition {
  if (typeof window === 'undefined') return DEFAULT_POSITION
  const stored = localStorage.getItem(STORAGE_KEY)
  return isPosition(stored) ? stored : DEFAULT_POSITION
}

interface UseSidebarPositionResult {
  position: SidebarPosition
  setPosition: (position: SidebarPosition) => void
}

/**
 * Which edge of the screen the sidebar is docked to — dragged by the user
 * (see Sidebar's drag handle), persisted per browser.
 *
 * Client-side only, like the collapse preference next door: it's chrome
 * layout, not account data. No pre-paint bootstrap either — it only feeds
 * a `data-sidebar-pos` attribute React writes on `.app`, which never
 * paints before React does.
 */
export function useSidebarPosition(): UseSidebarPositionResult {
  const [position, setPositionState] = useState<SidebarPosition>(getStored)

  useEffect(() => {
    function handleChange() {
      setPositionState(getStored())
    }
    window.addEventListener(CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(CHANGE_EVENT, handleChange)
  }, [])

  const setPosition = useCallback((next: SidebarPosition) => {
    localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { position, setPosition }
}
