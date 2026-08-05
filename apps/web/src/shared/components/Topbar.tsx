import { NotificationsBell } from './NotificationsBell'
import { ThemeToggle } from './ThemeToggle'

export type TopbarProps = {
  notificationCount: number
  notificationsPath: string
  onSettingsClick: () => void
  onLogoClick?: () => void
}

export function Topbar({
  notificationCount,
  notificationsPath,
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

      <NotificationsBell notificationCount={notificationCount} viewAllPath={notificationsPath} />

      <button className="icon-btn" onClick={onSettingsClick} aria-label="الإعدادات">
        <span className="ms">settings</span>
      </button>
    </header>
  )
}
