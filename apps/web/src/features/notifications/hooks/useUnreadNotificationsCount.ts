import { useEffect, useState } from 'react'
import { getUnreadNotificationsCount } from '../api/notifications.api'

const POLL_INTERVAL_MS = 30000

// Rendered from StudentLayout/TeacherLayout on every page, not just the
// notifications page, so the Topbar badge stays current on its own.
// Errors are swallowed on purpose: a stale/missing badge count isn't
// worth surfacing a page-level error state for.
export function useUnreadNotificationsCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await getUnreadNotificationsCount()
        if (!cancelled) {
          setCount(result.count)
        }
      } catch {
        // ignore — see comment above
      }
    }

    void load()
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return count
}
