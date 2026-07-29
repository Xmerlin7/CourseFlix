import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationType } from '../types/notification.types'

const TYPE_META: Record<NotificationType, { label: string; icon: string; lead: string }> = {
  hw_assigned: { label: 'واجب جديد', icon: 'assignment', lead: 'pink' },
  quiz_ready: { label: 'اختبار جاهز', icon: 'quiz', lead: '' },
  progress_report: { label: 'تقرير تقدم', icon: 'monitoring', lead: 'green' },
  announcement: { label: 'إعلان', icon: 'campaign', lead: 'pink' },
  course_update: { label: 'تحديث دورة', icon: 'menu_book', lead: '' },
  system: { label: 'إشعار عام', icon: 'info', lead: '' },
}

export function NotificationsPage() {
  const { data, isLoading, error, markRead, refetch } = useNotifications()
  const unreadCount = data.filter((notification) => !notification.isRead).length

  return (
    <>
      <h1 className="page-title">الإشعارات</h1>
      <p className="subtitle">
        {unreadCount > 0 ? `عندك ${unreadCount} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}
      </p>

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
            const meta = TYPE_META[notification.type]

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
