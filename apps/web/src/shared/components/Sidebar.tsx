export type SidebarProps = {
  role: 'student' | 'teacher'
  userName: string
  activePath: string
  onLogout?: () => void
  isOpen?: boolean
  isRail?: boolean
  onToggle?: () => void
  onToggleRail?: () => void
}

const studentNavItems = [
  { path: '/student/dashboard', label: 'الرئيسية', icon: 'home' },
  { path: '/student/courses', label: 'دوراتي', icon: 'menu_book' },
  { path: '/student/assistant', label: 'المساعد', icon: 'smart_toy' },
  { path: '/student/progress', label: 'التقدم', icon: 'monitoring' },
]

const teacherNavItems = [
  { path: '/teacher/dashboard', label: 'الرئيسية', icon: 'home' },
  { path: '/teacher/course', label: 'إدارة الدورة', icon: 'menu_book' },
  { path: '/teacher/students', label: 'الطلاب', icon: 'group' },
  { path: '/teacher/quizzes', label: 'الاختبارات', icon: 'quiz' },
]

export function Sidebar({
  role,
  userName,
  activePath,
  onLogout,
  isOpen = true,
  isRail = false,
  onToggle,
  onToggleRail,
}: SidebarProps) {
  const navItems = role === 'student' ? studentNavItems : teacherNavItems

  if (!isOpen) return null

  return (
    <aside className={`sidebar ${isRail ? 'rail' : ''}`}>
      <button
        onClick={onToggleRail || onToggle}
        className="icon-btn rail-toggle"
        aria-label="طي القائمة"
      >
        <span className="ms">menu_open</span>
      </button>

      <nav>
        {navItems.map((item) => {
          const isActive = item.path === activePath

          return (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className={`ms${isActive ? ' fill' : ''}`}>{item.icon}</span>
              <span className="lbl">{item.label}</span>
            </a>
          )
        })}
      </nav>

      <div className="side-footer">
        <a href="/settings" className="nav-item profile-item">
          <span className="avatar">
            <span className="ms">person</span>
          </span>
          <span className="lbl">{userName}</span>
        </a>

        <button onClick={onLogout} className="nav-item logout">
          <span className="ms">logout</span>
          <span className="lbl">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
