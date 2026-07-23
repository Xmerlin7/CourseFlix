import { useState } from 'react'
import { Topbar } from '../../shared/components/Topbar'
import { Sidebar } from '../../shared/components/Sidebar'

export function AppRouter() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isRail, setIsRail] = useState(() => {
    try {
      return localStorage.getItem('cf-rail') === '1'
    } catch {
      return false
    }
  })

  const handleRailToggle = () => {
    setIsRail((v) => {
      const next = !v
      try {
        localStorage.setItem('cf-rail', next ? '1' : '0')
      } catch {}
      return next
    })
  }

  return (
    <div className="app">
      <Sidebar
        role="student"
        userName="عبدالله حبسه"
        activePath="/student/courses"
        isOpen={isSidebarOpen}
        isRail={isRail}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        onToggleRail={handleRailToggle}
      />
      <div className="main">
        <div className="sheet">
          <Topbar
            notificationCount={4}
            onNotificationsClick={() => {}}
            onSettingsClick={() => {}}
            onLogoClick={() => setIsSidebarOpen((v) => !v)}
          />
          <div className="page">
            <p>محتوى تجريبي بسيط — لا حاجة لأي تصميم إضافي هنا</p>
          </div>
        </div>
      </div>
    </div>
  )
}
