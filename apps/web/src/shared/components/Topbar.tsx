import { Bell, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export type TopbarProps = {
  notificationCount: number
  onNotificationsClick: () => void
  onSettingsClick: () => void
}

export function Topbar({
  notificationCount,
  onNotificationsClick,
  onSettingsClick,
}: TopbarProps) {
  return (
    <header
      dir="rtl"
      className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between transition-colors duration-200 select-none"
    >
      {/* Brand Logo Link */}
      <a
        href="/"
        className="text-2xl font-black tracking-wider text-primary hover:opacity-90 active:scale-95 transition-all duration-200"
      >
        COURSEFLIX
      </a>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications Button */}
        <button
          onClick={onNotificationsClick}
          aria-label="الإشعارات"
          title="الإشعارات"
          className="group relative w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="relative">
            <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            {notificationCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </div>
        </button>

        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          aria-label="الإعدادات"
          title="الإعدادات"
          className="group w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
        </button>
      </div>
    </header>
  )
}