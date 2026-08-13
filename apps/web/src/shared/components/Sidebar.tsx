import { NavLink } from 'react-router'
import { ROUTE_PATHS } from '../../app/routes/route-paths'

export type SidebarProps = {
  role: 'student' | 'teacher' | 'admin' | 'assistant'
  userName: string
  avatarUrl?: string | null
  activePath: string
  onLogout?: () => void
  isOpen?: boolean
  isRail?: boolean
  onToggle?: () => void
  onToggleRail?: () => void
  // Only StudentLayout passes this today (the only role with a Profile
  // page so far) — omitted, the identity row stays the plain, non-
  // interactive display it's always been for teacher/admin/assistant.
  profilePath?: string
  // Unread activity indicators — student-only for now. A small dot
  // appears next to the nav item when the flag is true.
  communityHasUnread?: boolean
  supportHasUnread?: boolean
}

type NavItem = { path: string; label: string; icon: string }

// Only routes that actually exist in router.tsx are listed. The earlier
// version linked to /student/progress, /student/assistant, /teacher/students
// and /teacher/quizzes — none of which are routed, so every one of them
// dropped the user on the 404 page. They come back as each owner's slice
// ships, not before.
//
// Settings and Notifications are deliberately NOT linked here even
// though both routes/pages still exist and work fine — just no sidebar
// entry point for now. Remove this comment and re-add their NavItem
// entries below to bring them back.
const studentNavItems: NavItem[] = [
  { path: ROUTE_PATHS.STUDENT.DASHBOARD, label: 'الرئيسية', icon: 'home' },
  { path: ROUTE_PATHS.STUDENT.BROWSE, label: 'استكشف الدورات', icon: 'explore' },
  { path: ROUTE_PATHS.STUDENT.COURSES, label: 'دوراتي', icon: 'menu_book' },
  { path: ROUTE_PATHS.STUDENT.INTERVENTIONS, label: 'نقاط تحتاج مراجعة', icon: 'monitoring' },
  { path: ROUTE_PATHS.STUDENT.SUPPORT, label: 'الدعم الفني', icon: 'support_agent' },
  { path: ROUTE_PATHS.STUDENT.COMMUNITY, label: 'المجتمع', icon: 'groups' },
]

const teacherNavItems: NavItem[] = [
  { path: ROUTE_PATHS.TEACHER.DASHBOARD, label: 'الرئيسية', icon: 'home' },
  { path: ROUTE_PATHS.TEACHER.COURSES, label: 'دوراتي', icon: 'menu_book' },
  { path: ROUTE_PATHS.TEACHER.STUDENTS, label: 'الطلاب', icon: 'groups' },
  { path: ROUTE_PATHS.TEACHER.AGENT_LOGS, label: 'سجل الوكيل', icon: 'smart_toy' },
  { path: ROUTE_PATHS.TEACHER.INTERVENTIONS, label: 'تقارير المتابعة', icon: 'monitoring' },
  { path: ROUTE_PATHS.TEACHER.SALES, label: 'المبيعات', icon: 'payments' },
  { path: ROUTE_PATHS.TEACHER.ANALYTICS, label: 'مساعد التحليلات', icon: 'insights' },
  // Deliberately NOT in the assistant-exclusion list below — assistants
  // are meant to help triage support tickets too, see SupportStaffRoleGuard.
  { path: ROUTE_PATHS.TEACHER.SUPPORT, label: 'صندوق الدعم', icon: 'support_agent' },
]

// Assistants share the teacher's course/student surface but not
// anything payment- or analytics-adjacent — mirrors the API's
// TeacherRoleGuard-only controllers and the router's nested
// RequireRole("teacher") around those same four routes.
const TEACHER_ONLY_PATHS: string[] = [
  ROUTE_PATHS.TEACHER.AGENT_LOGS,
  ROUTE_PATHS.TEACHER.INTERVENTIONS,
  ROUTE_PATHS.TEACHER.SALES,
  ROUTE_PATHS.TEACHER.ANALYTICS,
]
const assistantNavItems: NavItem[] = teacherNavItems.filter(
  (item) => !TEACHER_ONLY_PATHS.includes(item.path),
)

// Grows alongside the admin route surface — only nav items whose route
// actually exists yet, same discipline as the other two lists above.
const adminNavItems: NavItem[] = [
  { path: ROUTE_PATHS.ADMIN.DASHBOARD, label: 'الرئيسية', icon: 'home' },
  { path: ROUTE_PATHS.ADMIN.USERS, label: 'المستخدمون', icon: 'manage_accounts' },
  { path: ROUTE_PATHS.ADMIN.COURSES, label: 'الدورات', icon: 'menu_book' },
  { path: ROUTE_PATHS.ADMIN.ORDERS, label: 'الطلبات', icon: 'shopping_cart' },
  { path: ROUTE_PATHS.ADMIN.QUIZZES, label: 'الاختبارات', icon: 'quiz' },
  { path: ROUTE_PATHS.ADMIN.DOCUMENTS, label: 'المستندات', icon: 'description' },
  { path: ROUTE_PATHS.ADMIN.INTERVENTIONS, label: 'تنبيهات المتابعة', icon: 'monitoring' },
  { path: ROUTE_PATHS.ADMIN.NOTIFICATIONS_LOG, label: 'سجل الإشعارات', icon: 'history' },
  { path: ROUTE_PATHS.ADMIN.AGENT_LOGS, label: 'سجل الوكلاء', icon: 'smart_toy' },
  { path: ROUTE_PATHS.ADMIN.SUPPORT, label: 'صندوق الدعم', icon: 'support_agent' },
]

const NAV_ITEMS_BY_ROLE: Record<SidebarProps['role'], NavItem[]> = {
  student: studentNavItems,
  teacher: teacherNavItems,
  admin: adminNavItems,
  assistant: assistantNavItems,
}

// Paths that have a per-item unread dot for the student role.
const SUPPORT_PATH = ROUTE_PATHS.STUDENT.SUPPORT
const COMMUNITY_PATH = ROUTE_PATHS.STUDENT.COMMUNITY

export function Sidebar({
  role,
  userName,
  avatarUrl,
  onLogout,
  isOpen = true,
  isRail = false,
  onToggle,
  onToggleRail,
  profilePath,
  communityHasUnread = false,
  supportHasUnread = false,
}: SidebarProps) {
  const navItems = NAV_ITEMS_BY_ROLE[role]

  if (!isOpen) return null

  function getUnreadDot(itemPath: string): boolean {
    if (role !== 'student') return false
    if (itemPath === SUPPORT_PATH) return supportHasUnread
    if (itemPath === COMMUNITY_PATH) return communityHasUnread
    return false
  }

  return (
    <aside className={`sidebar${isRail ? ' rail' : ''}`}>
      <button
        onClick={onToggleRail ?? onToggle}
        className="icon-btn rail-toggle"
        aria-label={isRail ? 'توسيع القائمة' : 'طي القائمة'}
        type="button"
      >
        <span className="ms">menu_open</span>
      </button>

      <nav>
        {navItems.map((item) => {
          const hasUnread = getUnreadDot(item.path)
          return (
            // NavLink, not <a href>: an anchor did a full document load on
            // every nav click, remounting the app and flashing the login
            // screen before the session re-resolved.
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`ms${isActive ? ' fill' : ''}`}>{item.icon}</span>
                  <span className="lbl">{item.label}</span>
                  {hasUnread && (
                    <span
                      className="nav-unread-dot"
                      aria-label="يوجد نشاط جديد"
                      role="status"
                    />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="side-footer">
        {/* Links to the Profile page when one exists for this role
            (student only, for now) — otherwise stays the plain,
            non-interactive identity display it's always been. */}
        {profilePath ? (
          <NavLink
            to={profilePath}
            title={userName}
            className={({ isActive }) => `nav-item profile-item${isActive ? ' active' : ''}`}
          >
            <span className="avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="ms">person</span>}
            </span>
            <span className="lbl">{userName}</span>
          </NavLink>
        ) : (
          <div className="nav-item profile-item" title={userName}>
            <span className="avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="ms">person</span>}
            </span>
            <span className="lbl">{userName}</span>
          </div>
        )}

        <button onClick={onLogout} className="nav-item logout" type="button">
          <span className="ms">logout</span>
          <span className="lbl">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
