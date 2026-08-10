import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cf-sidebar-collapsed'
// Same-tab only: localStorage's own 'storage' event never fires in the tab
// that wrote the value, so a plain custom event is what keeps the Sidebar's
// hook instance and Settings > Appearance's hook instance (mounted
// together, inside the same Layout) in sync when one of them changes it.
const CHANGE_EVENT = 'cf-sidebar-collapsed-change'

function getStored(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === '1'
}

interface UseSidebarCollapsedResult {
  isCollapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

/**
 * Shared, localStorage-backed "start collapsed" preference for the
 * Sidebar — read by every *Layout on mount, and settable from Settings >
 * Appearance. No pre-paint bootstrap needed (unlike theme/accent/corners):
 * this only affects the Sidebar's own initial React state, which never
 * paints before React does.
 */
export function useSidebarCollapsed(): UseSidebarCollapsedResult {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(getStored)

  useEffect(() => {
    function handleChange() {
      setIsCollapsedState(getStored())
    }
    window.addEventListener(CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(CHANGE_EVENT, handleChange)
  }, [])

  const setCollapsed = useCallback((next: boolean) => {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { isCollapsed, setCollapsed }
}
