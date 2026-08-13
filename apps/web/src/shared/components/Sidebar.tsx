import { useEffect } from 'react'
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
  /** Phone only: whether the slide-in drawer is showing. Ignored on
   *  desktop, where the sidebar is always visible. */
  isMobileOpen?: boolean
  /** Called when the drawer should close — a nav click, the scrim, the
   *  close button, or Escape. */
  onCloseMobile?: () => void
  onToggle?: () => void
  onToggleRail?: () => void
  // Every layout passes this now that all four roles have a profile
  // page. Left optional so a layout that genuinely has nowhere to send
  // the user still renders the identity row as plain, non-interactive
  // text rather than a dead link.
  profilePath?: string
  // Unread activity indicators — student-only for now. A small dot
  // appears next to the nav item when the flag is true.
  communityHasUnread?: boolean
  supportHasUnread?: boolean
  /** Teacher only: assistant actions waiting on their review. */
  pendingActionCount?: number
}

type NavItem = { path: string; label: string; icon: string }

// Only routes that actually exist in router.tsx are listed. The earlier
// version linked to /student/progress, /student/assistant, /teacher/students
// and /teacher/quizzes — none of which are routed, so every one of them
// dropped the user on the 404 page. They come back as each owner's slice
// ships, not before.
//
// Settings sits at the end of every list rather than only behind the
// topbar gear: on a phone the topbar is above the fold but the gear is a
// 24px target among three others, and it was the one piece of navigation
// with no entry in the menu itself.
const studentNavItems: NavItem[] = [
  { path: ROUTE_PATHS.STUDENT.DASHBOARD, label: 'الرئيسية', icon: 'home' },
  { path: ROUTE_PATHS.STUDENT.BROWSE, label: 'استكشف الدورات', icon: 'explore' },
  { path: ROUTE_PATHS.STUDENT.COURSES, label: 'دوراتي', icon: 'menu_book' },
  { path: ROUTE_PATHS.STUDENT.INTERVENTIONS, label: 'نقاط تحتاج مراجعة', icon: 'monitoring' },
  { path: ROUTE_PATHS.STUDENT.SUPPORT, label: 'الدعم الفني', icon: 'support_agent' },
  { path: ROUTE_PATHS.STUDENT.COMMUNITY, label: 'المجتمع', icon: 'groups' },
  { path: ROUTE_PATHS.STUDENT.SETTINGS, label: 'الإعدادات', icon: 'settings' },
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
  // Both roles see this, with different meanings: the teacher reviews
  // what their assistants parked, the assistant tracks their own.
  { path: ROUTE_PATHS.TEACHER.ASSISTANT_ACTIONS, label: 'طلبات المساعدين', icon: 'rule' },
  { path: ROUTE_PATHS.TEACHER.SETTINGS, label: 'الإعدادات', icon: 'settings' },
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
  { path: ROUTE_PATHS.ADMIN.SETTINGS, label: 'الإعدادات', icon: 'settings' },
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
  isMobileOpen = false,
  onCloseMobile,
  onToggle,
  onToggleRail,
  profilePath,
  communityHasUnread = false,
  supportHasUnread = false,
  pendingActionCount = 0,
}: SidebarProps) {
  const navItems = NAV_ITEMS_BY_ROLE[role]

  // Escape closes the drawer, matching every other overlay in the app.
  // Bound unconditionally (not behind `isMobileOpen`) so the hook order
  // stays stable across renders; the handler itself no-ops when shut.
  useEffect(() => {
    if (!isMobileOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMobile?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobileOpen, onCloseMobile])

  if (!isOpen) return null

  function getBadgeCount(itemPath: string): number {
    return itemPath === ROUTE_PATHS.TEACHER.ASSISTANT_ACTIONS
      ? pendingActionCount
      : 0
  }

  function getUnreadDot(itemPath: string): boolean {
    if (role !== 'student') return false
    if (itemPath === SUPPORT_PATH) return supportHasUnread
    if (itemPath === COMMUNITY_PATH) return communityHasUnread
    return false
  }

  return (
    <>
      {/* Scrim only exists while the phone drawer is open; on desktop the
          sidebar is part of the layout and has nothing behind it. */}
      {isMobileOpen && (
        <div className="sidebar-scrim" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`sidebar${isRail ? ' rail' : ''}${isMobileOpen ? ' mobile-open' : ''}`}
      >
      <button
        onClick={onToggleRail ?? onToggle}
        className="icon-btn rail-toggle"
        aria-label={isRail ? 'توسيع القائمة' : 'طي القائمة'}
        type="button"
      >
        <span className="ms">menu_open</span>
      </button>

      {/* Phone-only close affordance. The scrim and Escape both work, but
          neither is discoverable, and the drawer covers the topbar button
          that opened it. */}
      <button
        onClick={onCloseMobile}
        className="icon-btn sidebar-close"
        aria-label="إغلاق القائمة"
        type="button"
      >
        <span className="ms">close</span>
      </button>

      <nav>
        {navItems.map((item) => {
          const hasUnread = getUnreadDot(item.path)
          const badgeCount = getBadgeCount(item.path)
          return (
            // NavLink, not <a href>: an anchor did a full document load on
            // every nav click, remounting the app and flashing the login
            // screen before the session re-resolved.
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`ms${isActive ? ' fill' : ''}`}>{item.icon}</span>
                  <span className="lbl">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="nav-count-badge" aria-label={`${badgeCount} بانتظار المراجعة`}>
                      {badgeCount}
                    </span>
                  )}
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
        {/* The identity row doubles as the link to this role's profile
            page. All four roles have one; the non-link branch is the
            fallback for a layout that doesn't pass a path. */}
        {profilePath ? (
          <NavLink
            to={profilePath}
            onClick={onCloseMobile}
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
    </>
  )
}
