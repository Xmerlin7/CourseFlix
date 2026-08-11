import { useCallback, useEffect, useState } from 'react'

export const DENSITIES = ['comfortable', 'compact'] as const
export type Density = (typeof DENSITIES)[number]

const STORAGE_KEY = 'cf-density'
const DEFAULT_DENSITY: Density = 'comfortable'

function isDensity(value: string | null): value is Density {
  return !!value && (DENSITIES as readonly string[]).includes(value)
}

function getStoredDensity(): Density {
  if (typeof window === 'undefined') return DEFAULT_DENSITY
  const stored = localStorage.getItem(STORAGE_KEY)
  return isDensity(stored) ? stored : DEFAULT_DENSITY
}

interface UseDensityResult {
  density: Density
  setDensity: (density: Density) => void
}

/**
 * Applies a `data-density` attribute on <html> that scales the
 * --space-scale token (see index.css) consumed by card/list/form-field
 * padding — a smaller, denser layout for anyone who'd rather see more
 * on screen at once.
 */
export function useDensity(): UseDensityResult {
  const [density, setDensityState] = useState<Density>(getStoredDensity)

  useEffect(() => {
    if (density === DEFAULT_DENSITY) {
      document.documentElement.removeAttribute('data-density')
    } else {
      document.documentElement.setAttribute('data-density', density)
    }
    localStorage.setItem(STORAGE_KEY, density)
  }, [density])

  const setDensity = useCallback((next: Density) => setDensityState(next), [])

  return { density, setDensity }
}
