import { useEffect, useState } from 'react'
import { getNotifications } from '../../features/notifications/api/notifications.api'

const POLL_INTERVAL_MS = 30_000

const COMMUNITY_TYPES = new Set(['discussion_reply', 'discussion_accepted'])
const SUPPORT_TYPES = new Set(['support_ticket_update'])

interface SidebarUnreadState {
  communityHasUnread: boolean
  supportHasUnread: boolean
}

/**
 * Polls unread notifications every 30 s and returns boolean flags indicating
 * whether there is new community activity (discussion replies / accepted answers)
 * or new support activity (ticket updates) for the current user.
 *
 * Errors are swallowed — a stale/missing dot is not worth a page-level error.
 */
export function useStudentSidebarUnread(): SidebarUnreadState {
  const [state, setState] = useState<SidebarUnreadState>({
    communityHasUnread: false,
    supportHasUnread: false,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const items = await getNotifications({ status: 'unread' })
        if (cancelled) return
        let community = false
        let support = false
        for (const item of items) {
          if (COMMUNITY_TYPES.has(item.type)) community = true
          if (SUPPORT_TYPES.has(item.type)) support = true
          if (community && support) break
        }
        setState({ communityHasUnread: community, supportHasUnread: support })
      } catch {
        // ignore — see jsdoc above
      }
    }

    void load()
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return state
}
