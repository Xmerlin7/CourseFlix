import { Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { useAdminAnalyticsOverview } from '../hooks/useAdminAnalyticsOverview'

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useAdminAnalyticsOverview()

  return (
    <>
      <h1 className="page-title">أهلاً، {user?.fullName ?? 'أدمن'}</h1>
      <p className="subtitle">لوحة تحكم الأدمن — إدارة المنصة بالكامل من مكان واحد</p>

      {isLoading && <LoadingState variant="cards" />}

      {!isLoading && error && (
        <ErrorState title="تعذر تحميل الإحصائيات" message="لم نتمكن من تحميل نظرة عامة على المنصة." onRetry={refetch} />
      )}

      {!isLoading && !error && data && (
        <div className="tiles section">
          <Link to={ROUTE_PATHS.ADMIN.USERS} className="tile" style={{ cursor: 'pointer' }}>
            <span className="lead-ic">
              <span className="ms">manage_accounts</span>
            </span>
            <span className="lbl">المستخدمون</span>
            <span className="num">{data.users.total}</span>
            <span className="meta">
              {data.users.students} طالب · {data.users.teachers} معلم · {data.users.admins} أدمن
            </span>
          </Link>

          <Link to={ROUTE_PATHS.ADMIN.COURSES} className="tile" style={{ cursor: 'pointer' }}>
            <span className="lead-ic">
              <span className="ms">menu_book</span>
            </span>
            <span className="lbl">الدورات</span>
            <span className="num">{data.courses.total}</span>
            <span className="meta">
              {data.courses.published} منشورة · {data.courses.draft} مسودة
            </span>
          </Link>

          <Link to={ROUTE_PATHS.ADMIN.ORDERS} className="tile" style={{ cursor: 'pointer' }}>
            <span className="lead-ic">
              <span className="ms">payments</span>
            </span>
            <span className="lbl">الإيرادات</span>
            <span className="num" style={{ wordBreak: 'break-word' }}>
              {formatMoney(data.commerce.revenueMinor, data.commerce.currency)}
            </span>
            <span className="meta">
              {data.commerce.paidOrders} من {data.commerce.totalOrders} طلب مدفوع
            </span>
          </Link>

          <Link to={ROUTE_PATHS.ADMIN.INTERVENTIONS} className="tile" style={{ cursor: 'pointer' }}>
            <span className="lead-ic">
              <span className="ms">monitoring</span>
            </span>
            <span className="lbl">تنبيهات نشطة</span>
            <span className="num">{data.interventions.active}</span>
          </Link>
        </div>
      )}
    </>
  )
}
