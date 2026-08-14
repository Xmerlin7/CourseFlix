import { useEffect, useState } from 'react'
import { getUnreadNotificationsCount } from '../api/notifications.api'
import { UNREAD_NOTIFICATIONS_CHANGED_EVENT } from '../utils/notificationEvents'

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

    function handleUnreadChange() {
      void load()
    }

    window.addEventListener(UNREAD_NOTIFICATIONS_CHANGED_EVENT, handleUnreadChange)
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.removeEventListener(UNREAD_NOTIFICATIONS_CHANGED_EVENT, handleUnreadChange)
      clearInterval(timer)
    }
  }, [])

  return count
}
