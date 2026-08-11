import { useEffect } from 'react'
import { applyAccentHex, getStoredAccentHex } from './useAccentColor'

/**
 * Keeps the accent color's light/dark values in sync with the current
 * theme for the whole app's lifetime, not just while Settings >
 * Appearance's tab happens to be mounted. useAccentColor (and its own
 * theme-aware apply) only runs while that one tab is open — flipping
 * light/dark from the Topbar's quick toggle, or from anywhere else on
 * the site, needs something that's always listening. Mount this once
 * at the app root (see App.tsx).
 */
export function useAccentThemeSync(): void {
  useEffect(() => {
    const reapply = () => applyAccentHex(getStoredAccentHex())
    const observer = new MutationObserver(reapply)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
}
