import { Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'

// Platform-wide stat cards land in a later slice once every admin
// resource exists to aggregate over — for now this is a landing pad.
export function AdminDashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <h1 className="page-title">أهلاً، {user?.fullName ?? 'أدمن'}</h1>
      <p className="subtitle">لوحة تحكم الأدمن — إدارة المنصة بالكامل من مكان واحد</p>

      <div className="tiles section">
        <Link to={ROUTE_PATHS.ADMIN.USERS} className="tile" style={{ cursor: 'pointer' }}>
          <span className="lead-ic">
            <span className="ms">manage_accounts</span>
          </span>
          <span className="lbl">إدارة المستخدمين</span>
        </Link>
      </div>
    </>
  )
}
