import { Bell, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export type TopbarProps = {
  notificationCount: number
  onNotificationsClick: () => void
  onSettingsClick: () => void
  onLogoClick?: () => void
}

export function Topbar({
  notificationCount,
  onNotificationsClick,
  onSettingsClick,
  onLogoClick,
}: TopbarProps) {
  return (
    <header className="topbar">
      <a
        className="logo"
        href="/"
        onClick={(e) => {
          e.preventDefault()
          onLogoClick?.()
        }}
      >
        COURSEFLIX
      </a>

      <div className="grow" />

      <ThemeToggle />

      <button className="icon-btn" onClick={onNotificationsClick} aria-label="الإشعارات">
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="badge">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      <button className="icon-btn" onClick={onSettingsClick} aria-label="الإعدادات">
        <Settings className="w-5 h-5" />
      </button>
    </header>
  )
}