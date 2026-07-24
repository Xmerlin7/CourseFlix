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
        <span className="ms">notifications</span>
        {notificationCount > 0 && (
          <span className="badge">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      <button className="icon-btn" onClick={onSettingsClick} aria-label="الإعدادات">
        <span className="ms">settings</span>
      </button>
    </header>
  )
}
