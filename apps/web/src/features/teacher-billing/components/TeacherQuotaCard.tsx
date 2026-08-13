import { useTeacherQuota } from '../hooks/useTeacherQuota'
import type { TeacherQuota } from '../types/teacher-billing.types'

/**
 * Teacher-only card on the profile page. Rendered only when the signed-in
 * role is teacher — assistants never see it (the API route is teacher-only
 * as well, so this is belt-and-braces).
 */
export function TeacherQuotaCard() {
  const quota = useTeacherQuota(true)

  if (!quota) {
    return (
      <section className="card quota-card">
        <div className="profile-card-head">
          <h3 className="profile-card-title">حصتك الشهرية</h3>
          <p className="profile-card-sub">جارٍ تحميل الرصيد...</p>
        </div>
      </section>
    )
  }

  return <QuotaCardBody quota={quota} />
}

function QuotaCardBody({ quota }: { quota: TeacherQuota }) {
  const isLow = quota.percentUsed >= 80
  const isExhausted = quota.percentUsed >= 100

  return (
    <section className="card quota-card">
      <div className="profile-card-head">
        <h3 className="profile-card-title">حصتك الشهرية</h3>
        <p className="profile-card-sub">
          الرصيد اللي بيشتغل بيه المساعد الذكي، توليد الاختبارات، ومهام الذكاء الاصطناعي التانية
        </p>
      </div>

      <div className="quota-numbers">
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">bolt</span>
          </span>
          <span className="lbl">متبقي</span>
          <span className="num">
            <bdi>{quota.remainingCredits}</bdi>
          </span>
        </div>
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">all_inbox</span>
          </span>
          <span className="lbl">رصيد الشهر</span>
          <span className="num">
            <bdi>{quota.totalCredits}</bdi>
          </span>
        </div>
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">account_balance_wallet</span>
          </span>
          <span className="lbl">مستخدم</span>
          <span className="num">
            <bdi>{quota.usedCredits}</bdi>
          </span>
        </div>
      </div>

      <div className="progress quota-progress" aria-hidden="true">
        <div className="bar" style={{ width: `${quota.percentUsed}%` }} />
      </div>
      <p className="meta">
        استهلكت <bdi>{quota.percentUsed}%</bdi> من رصيدك — بيتجدد أول كل شهر.
        {isLow && (
          <strong className="quota-warning">
            {' '}
            {isExhausted
              ? 'رصيدك خلص — تواصل مع الإدارة لإعادة الشحن.'
              : 'رصيدك قارب على النهاية — تواصل مع الإدارة لإعادة الشحن.'}
          </strong>
        )}
      </p>
    </section>
  )
}
