import { useEffect, useState } from 'react'
import { getPendingActionCount } from '../api/assistant-actions.api'

/**
 * Drives the sidebar badge on the teacher's review link.
 *
 * Polled rather than pushed: there's no websocket in this app, and an
 * assistant can park an action at any moment while the teacher sits on an
 * unrelated page. 60s is slow enough to be invisible in the network tab
 * and fast enough that the badge isn't stale by the time they notice it.
 */
export function usePendingActionCount(enabled: boolean): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    async function load() {
      try {
        const next = await getPendingActionCount()
        if (!cancelled) setCount(next)
      } catch {
        // A failed poll leaves the previous badge in place — an error
        // toast every minute would be worse than a slightly stale count.
      }
    }

    void load()
    const timer = setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled])

  return count
}
