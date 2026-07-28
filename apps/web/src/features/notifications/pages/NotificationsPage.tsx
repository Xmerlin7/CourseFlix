import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationType } from '../types/notification.types'

const TYPE_LABELS: Record<NotificationType, string> = {
  hw_assigned: 'واجب جديد',
  quiz_ready: 'اختبار جاهز',
  progress_report: 'تقرير تقدم',
  announcement: 'إعلان',
  course_update: 'تحديث كورس',
  system: 'إشعار عام',
}

export function NotificationsPage() {
  const { data, isLoading, error, markRead, refetch } = useNotifications()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader title="الإشعارات" />

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
        <ul className="flex flex-col gap-2">
          {data.map((notification) => (
            <li
              key={notification.id}
              className={`flex flex-col gap-1 rounded-lg border p-4 ${
                notification.isRead
                  ? 'border-gray-200 dark:border-gray-800'
                  : 'border-primary/40 bg-primary/5'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {TYPE_LABELS[notification.type]}
                </span>
                {!notification.isRead && (
                  <button
                    onClick={() => void markRead(notification.id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    تعليم كمقروء
                  </button>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
