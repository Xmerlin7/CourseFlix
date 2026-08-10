import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { Link } from 'react-router'
import { NOTIFICATION_TYPE } from '../../../shared/lib/status-labels'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationType } from '../types/notification.types'

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
  const unreadCount = data.filter((notification) => !notification.isRead).length

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

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && <ErrorState onRetry={refetch} />}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          variant="notifications"
          title="لا توجد إشعارات"
          message="هتلاقي هنا كل التحديثات المهمة أول ما توصلك"
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="list">
          {data.map((notification) => {
            const meta = NOTIFICATION_TYPE[notification.type]
            const miniQuizPath =
              notification.relatedEntityType === 'mini_quiz' && notification.relatedEntityId
                ? `/student/mini-quizzes/${notification.relatedEntityId}`
                : null

            return (
              <div key={notification.id} className="list-item">
                <span className={`lead ${meta.lead}`}>
                  <span className="ms">{meta.icon}</span>
                </span>

                <span className="body">
                  <span className="t">{notification.title}</span>
                  <span className="s">{notification.message}</span>
                </span>

                <span className="end">
                  <span className="chip outline">{meta.label}</span>

                  {miniQuizPath && (
                    <Link to={miniQuizPath} className="btn tonal">
                      <span className="ms">quiz</span>
                      ابدأ الكويز
                    </Link>
                  )}

                  {!notification.isRead && (
                    <>
                      <span className="unread-dot" aria-label="غير مقروء" />
                      <button
                        type="button"
                        onClick={() => void markRead(notification.id)}
                        className="btn text"
                      >
                        تعليم كمقروء
                      </button>
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
