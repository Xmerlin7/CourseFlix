import type { TeacherQuota } from '../../types/teacher-billing.types'

interface QuotaChipProps {
  quota: TeacherQuota
  onClick?: () => void
}

/**
 * Topbar chip showing the teacher's AI-credit balance. Warns once 80% of
 * the cycle is consumed. Clicking goes to the profile page where the full
 * card (progress bar + reset date) lives.
 */
export function QuotaChip({ quota, onClick }: QuotaChipProps) {
  const isLow = quota.percentUsed >= 80
  return (
    <button
      type="button"
      className={`quota-chip${isLow ? ' warn' : ''}`}
      onClick={onClick}
      aria-label={`رصيد حصة المساعد: متبقي ${quota.remainingCredits} من ${quota.totalCredits}`}
    >
      <span className="ms">bolt</span>
      <span className="quota-chip-label">الحصة</span>
      <span className="quota-chip-numbers">
        <bdi>
          {quota.remainingCredits} / {quota.totalCredits}
        </bdi>
      </span>
    </button>
  )
}
