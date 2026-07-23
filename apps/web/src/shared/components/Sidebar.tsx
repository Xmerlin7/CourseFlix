import { Home, BookOpen, Bot, BarChart3, Users, ClipboardList, LogOut, Menu, User } from 'lucide-react'

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
  { path: '/student/dashboard', label: 'الرئيسية', icon: Home },
  { path: '/student/courses', label: 'دوراتي', icon: BookOpen },
  { path: '/student/assistant', label: 'المساعد', icon: Bot },
  { path: '/student/progress', label: 'التقدم', icon: BarChart3 },
]

const teacherNavItems = [
  { path: '/teacher/dashboard', label: 'الرئيسية', icon: Home },
  { path: '/teacher/course', label: 'إدارة الدورة', icon: BookOpen },
  { path: '/teacher/students', label: 'الطلاب', icon: Users },
  { path: '/teacher/quizzes', label: 'الاختبارات', icon: ClipboardList },
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
        <Menu className="w-5 h-5" />
      </button>

      <nav>
        {navItems.map((item) => {
          const isActive = item.path === activePath
          const Icon = item.icon

          return (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 flex-none" />
              <span className="lbl">{item.label}</span>
            </a>
          )
        })}
      </nav>

      <div className="side-footer">
        <a href="/settings" className="nav-item profile-item">
          <span className="avatar">
            <User className="w-5 h-5" />
          </span>
          <span className="lbl">{userName}</span>
        </a>

        <button onClick={onLogout} className="nav-item logout">
          <LogOut className="w-5 h-5 flex-none" />
          <span className="lbl">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}