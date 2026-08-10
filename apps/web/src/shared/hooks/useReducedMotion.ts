import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cf-reduce-motion'

function getStored(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === '1'
}

interface UseReducedMotionResult {
  reduceMotion: boolean
  setReduceMotion: (value: boolean) => void
}

/**
 * Applies a `data-reduce-motion` attribute on <html> that a matching CSS
 * block (see index.css) uses to collapse every transition/animation
 * duration to near-zero — the same technique browsers use for
 * `prefers-reduced-motion: reduce`, as an explicit, persisted choice
 * instead of only following the OS setting.
 */
export function useReducedMotion(): UseReducedMotionResult {
  const [reduceMotion, setReduceMotionState] = useState<boolean>(getStored)

  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', reduceMotion)
    localStorage.setItem(STORAGE_KEY, reduceMotion ? '1' : '0')
  }, [reduceMotion])

  const setReduceMotion = useCallback((next: boolean) => setReduceMotionState(next), [])

  return { reduceMotion, setReduceMotion }
}
