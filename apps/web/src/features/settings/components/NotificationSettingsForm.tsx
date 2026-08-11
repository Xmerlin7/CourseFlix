import { ErrorState } from '../../../shared/components/ErrorState'
import { Switch } from '../../../shared/components/Switch'
import { showToast } from '../../../shared/components/Toast'
import { NOTIFICATION_TYPE } from '../../../shared/lib/status-labels'
import { useSettings } from '../hooks/useSettings'
import type { NotificationType } from '../../notifications/types/notification.types'

const ALL_TYPES = Object.keys(NOTIFICATION_TYPE) as NotificationType[]

export function NotificationSettingsForm() {
  const { data, isLoading, error, isSaving, setNotificationPreference, refetch } = useSettings()

  if (isLoading) {
    return (
      <div className="card skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى">
        {ALL_TYPES.map((type) => (
          <div key={type} className="settings-row">
            <span className="skeleton" style={{ height: 15, width: '40%', borderRadius: 6 }} />
            <span className="skeleton" style={{ height: 30, width: 52, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState title="تعذر تحميل التفضيلات" message="حاول مرة أخرى" onRetry={refetch} />
  }

  async function handleToggle(type: NotificationType, enabled: boolean) {
    try {
      await setNotificationPreference(type, enabled)
    } catch {
      showToast('حصل خطأ، حاول تاني', 'error')
    }
  }

  return (
    <div className="card settings-card">
      <h3 style={{ marginBottom: 0 }}>إشعارات داخل التطبيق</h3>
      <p className="meta">تحكّم في نوع الإشعارات اللي عايز تستقبلها.</p>

      <div>
        {ALL_TYPES.map((type) => {
          const meta = NOTIFICATION_TYPE[type]
          const enabled = data.notificationPreferences[type] !== false

          return (
            <div key={type} className="settings-row">
              <div className="lbl-group">
                <span className="t">
                  <span className="ms" style={{ fontSize: 18, verticalAlign: 'middle', marginInlineEnd: 6 }}>
                    {meta.icon}
                  </span>
                  {meta.label}
                </span>
              </div>
              <Switch
                checked={enabled}
                disabled={isSaving}
                onChange={(checked) => void handleToggle(type, checked)}
                label={`تفعيل إشعارات ${meta.label}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
