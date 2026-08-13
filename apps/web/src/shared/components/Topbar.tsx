import { NotificationsBell } from './NotificationsBell'
import { ThemeToggle } from './ThemeToggle'
import { QuotaChip } from '../../features/teacher-billing/components/QuotaChip'
import type { TeacherQuota } from '../../features/teacher-billing/types/teacher-billing.types'

export type TopbarProps = {
  notificationCount: number
  notificationsPath: string
  onSettingsClick: () => void
  onLogoClick?: () => void
  /** Opens the phone nav drawer. The button is hidden on desktop, where
   *  the sidebar is always on screen. */
  onMenuClick?: () => void
  /** Teacher only: their AI-credit balance, rendered as a chip next to
   *  the bell. The layout passes null for every other role. */
  quota?: TeacherQuota | null
  onQuotaClick?: () => void
}

export function Topbar({
  notificationCount,
  notificationsPath,
  onSettingsClick,
  onLogoClick,
  onMenuClick,
  quota = null,
  onQuotaClick,
}: TopbarProps) {
  return (
    <header className="topbar">
      {onMenuClick && (
        <button
          className="icon-btn topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          type="button"
        >
          <span className="ms">menu</span>
        </button>
      )}

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

      {quota && <QuotaChip quota={quota} onClick={onQuotaClick} />}

      <ThemeToggle />

      <NotificationsBell notificationCount={notificationCount} viewAllPath={notificationsPath} />

      <button className="icon-btn" onClick={onSettingsClick} aria-label="الإعدادات">
        <span className="ms">settings</span>
      </button>
    </header>
  )
}
