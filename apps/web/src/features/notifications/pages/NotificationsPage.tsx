import { useCallback } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { Link } from 'react-router'
import { NOTIFICATION_TYPE } from '../../../shared/lib/status-labels'
import { useAuth } from '../../auth/hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationsSkeleton } from '../components/NotificationsSkeleton'
import { resolveNotificationTarget } from '../lib/notification-target'
import type { NotificationType } from '../types/notification.types'

const PAGE_SIZE = 10

const STATUS_OPTIONS: Array<{ label: string; value: 'all' | 'unread' | 'read' }> = [
  { label: 'الكل', value: 'all' },
  { label: 'غير مقروء', value: 'unread' },
  { label: 'مقروء', value: 'read' },
]

const TYPE_OPTIONS: Array<{ label: string; value: 'all' | NotificationType }> = [
  { label: 'كل الأنواع', value: 'all' },
  ...(
    Object.entries(NOTIFICATION_TYPE) as Array<
      [NotificationType, (typeof NOTIFICATION_TYPE)[NotificationType]]
    >
  ).map(([type, meta]) => ({ label: meta.label, value: type })),
]

export function NotificationsPage() {
  const {
    data,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    markRead,
    markAllRead,
    refetch,
  } = useNotifications()
  const { user } = useAuth()
  const unreadCount = data.filter((notification) => !notification.isRead).length

  const toHaystack = useCallback(
    (notification: (typeof data)[number]) =>
      `${notification.title} ${notification.message}`,
    [],
  )
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            الإشعارات
          </h1>
          <p className="subtitle">
            {unreadCount > 0 ? `عندك ${unreadCount} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}
          </p>
        </div>
        <button
          type="button"
          className="btn text"
          disabled={unreadCount === 0}
          onClick={() => void markAllRead()}
        >
          <span className="ms">done_all</span>
          تحديد الكل كمقروء
        </button>
      </div>

      <div className="actions section">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter(option.value)}
            className={`chip clickable outline${statusFilter === option.value ? ' selected' : ''}`}
            aria-pressed={statusFilter === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="actions section">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTypeFilter(option.value)}
            className={`chip clickable outline${typeFilter === option.value ? ' selected' : ''}`}
            aria-pressed={typeFilter === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SearchField
        id="notifications-search"
        label="بحث في الإشعارات"
        placeholder="ابحث في عناوين الإشعارات ونصّها..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <NotificationsSkeleton />}

      {!isLoading && error && <ErrorState onRetry={refetch} />}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          variant="notifications"
          title="لا توجد إشعارات"
          message="هتلاقي هنا كل التحديثات المهمة أول ما توصلك"
        />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState
          variant="notifications"
          title="لا توجد نتائج"
          message="مفيش إشعارات مطابقة لبحثك، جرّب كلمة تانية"
        />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="list">
          {list.pageItems.map((notification) => {
            const meta = NOTIFICATION_TYPE[notification.type]
            const target = user ? resolveNotificationTarget(notification, user.role) : null
            const handleRowClick = () => {
              if (!notification.isRead) void markRead(notification.id)
            }

            const row = (
              <>
                <span className={`lead ${meta.lead}`}>
                  <span className="ms">{meta.icon}</span>
                </span>

                <span className="body">
                  <span className="t">{notification.title}</span>
                  <span className="s">{notification.message}</span>
                </span>

                <span className="end">
                  <span className="chip outline">{meta.label}</span>

                  {!notification.isRead && (
                    <span className="unread-dot" aria-label="غير مقروء" />
                  )}

                  {!notification.isRead && !target && (
                    <button
                      type="button"
                      onClick={() => void markRead(notification.id)}
                      className="btn text"
                    >
                      تعليم كمقروء
                    </button>
                  )}
                </span>
              </>
            )

            return target ? (
              <Link
                key={notification.id}
                to={target.path}
                className="list-item"
                onClick={handleRowClick}
              >
                {row}
              </Link>
            ) : (
              <div key={notification.id} className="list-item">
                {row}
              </div>
            )
          })}
        </div>
      )}

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="إشعار"
        />
      )}
    </>
  )
}
