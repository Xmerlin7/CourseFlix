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
    // Once immediately on mount too — belt and suspenders against any
    // drift between index.html's pre-paint script and the mounted app
    // (e.g. in dev, where HMR can leave the two out of step).
    reapply()
    const observer = new MutationObserver(reapply)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
}
