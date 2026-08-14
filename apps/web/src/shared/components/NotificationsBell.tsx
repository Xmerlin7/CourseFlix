import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../features/notifications/api/notifications.api'
import { resolveNotificationTarget } from '../../features/notifications/lib/notification-target'
import type { NotificationItem, NotificationType } from '../../features/notifications/types/notification.types'

const TYPE_META: Record<NotificationType, { icon: string; lead: string }> = {
  hw_assigned: { icon: 'assignment', lead: 'pink' },
  quiz_ready: { icon: 'quiz', lead: '' },
  progress_report: { icon: 'monitoring', lead: 'green' },
  announcement: { icon: 'campaign', lead: 'pink' },
  course_update: { icon: 'menu_book', lead: '' },
  system: { icon: 'info', lead: '' },
  discussion_reply: { icon: 'forum', lead: '' },
  discussion_accepted: { icon: 'check_circle', lead: 'green' },
  support_ticket_update: { icon: 'support_agent', lead: 'pink' },
}

// Panel only shows a recent slice — the full filterable list already
// lives on the notifications page this panel links out to.
const PANEL_LIMIT = 6

/** The view-all path is role-scoped (`/student|teacher|admin/notifications`),
 *  so it doubles as the role signal for deep-linking each item. */
function roleFromViewAllPath(viewAllPath: string): 'student' | 'teacher' | 'admin' | null {
  if (viewAllPath.startsWith('/student/')) return 'student'
  if (viewAllPath.startsWith('/teacher/')) return 'teacher'
  if (viewAllPath.startsWith('/admin/')) return 'admin'
  return null
}

export type NotificationsBellProps = {
  notificationCount: number
  viewAllPath: string
}

export function NotificationsBell({ notificationCount, viewAllPath }: NotificationsBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fetched lazily on open instead of on every Topbar mount — the badge
  // count already comes from the cheap polled endpoint, so there's no
  // reason to pull the full list until someone actually opens the panel.
  useEffect(() => {
    if (!isOpen) return

    const controller = new AbortController()
    setIsLoading(true)
    setHasError(false)

    getNotifications()
      .then((data) => {
        if (!controller.signal.aborted) setItems(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setHasError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  async function handleMarkRead(notificationId: string) {
    setItems((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
    )
    try {
      await markNotificationRead(notificationId)
    } catch {
      // Panel is a lightweight preview — a failed mark-read here just
      // means the notifications page will show the true state on visit.
    }
  }

  async function handleMarkAllRead() {
    setItems((current) => current.map((item) => ({ ...item, isRead: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      // See handleMarkRead — best-effort from the panel.
    }
  }

  const visible = items.slice(0, PANEL_LIMIT)
  const panelUnreadCount = items.filter((item) => !item.isRead).length
  const role = roleFromViewAllPath(viewAllPath)

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="الإشعارات"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="ms">notifications</span>
        {notificationCount > 0 && (
          <span className="badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-panel" role="dialog" aria-label="الإشعارات">
          <div className="notif-panel-head">
            <span>الإشعارات</span>
            <button
              type="button"
              className="btn text"
              disabled={panelUnreadCount === 0}
              onClick={() => void handleMarkAllRead()}
            >
              <span className="ms sm">done_all</span>
              تحديد الكل كمقروء
            </button>
          </div>

          <div className="notif-panel-body">
            {isLoading && <p className="notif-panel-msg">جارٍ التحميل...</p>}
            {!isLoading && hasError && <p className="notif-panel-msg">تعذّر تحميل الإشعارات</p>}
            {!isLoading && !hasError && visible.length === 0 && (
              <p className="notif-panel-msg">لا توجد إشعارات</p>
            )}
            {!isLoading &&
              !hasError &&
              visible.map((item) => {
                const meta = TYPE_META[item.type]
                const target = role ? resolveNotificationTarget(item, role) : null
                const onOpen = () => {
                  if (!item.isRead) void handleMarkRead(item.id)
                  setIsOpen(false)
                }
                const body = (
                  <>
                    <span className={`lead ${meta.lead}`}>
                      <span className="ms sm">{meta.icon}</span>
                    </span>
                    <span className="body">
                      <span className="t">{item.title}</span>
                      <span className="s">{item.message}</span>
                    </span>
                    {!item.isRead && <span className="unread-dot" aria-label="غير مقروء" />}
                  </>
                )
                return target ? (
                  <Link
                    key={item.id}
                    to={target.path}
                    className={`list-item hoverable notif-item ${item.isRead ? 'read' : 'unread'}`}
                    onClick={onOpen}
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    className={`list-item hoverable notif-item ${item.isRead ? 'read' : 'unread'}`}
                    onClick={() => {
                      if (!item.isRead) void handleMarkRead(item.id)
                    }}
                  >
                    {body}
                  </button>
                )
              })}
          </div>

          <Link to={viewAllPath} className="notif-panel-foot" onClick={() => setIsOpen(false)}>
            عرض كل الإشعارات
            <span className="ms sm">arrow_back</span>
          </Link>
        </div>
      )}
    </div>
  )
}
