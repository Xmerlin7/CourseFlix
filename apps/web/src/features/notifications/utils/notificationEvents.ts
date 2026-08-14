/**
 * Custom event name dispatched whenever unread notifications, discussion
 * threads, or support tickets are marked as read, or when a new message is received.
 *
 * Hooks like `useStudentSidebarUnread` and `useUnreadNotificationsCount` listen
 * to this event to refresh their state immediately with zero delay.
 */
export const UNREAD_NOTIFICATIONS_CHANGED_EVENT = 'unread-notifications-changed'

export function emitUnreadCountChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UNREAD_NOTIFICATIONS_CHANGED_EVENT))
  }
}
