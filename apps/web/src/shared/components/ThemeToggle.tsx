import { useTheme } from '../hooks/useTheme'

// Quick binary flip for the topbar — always sets an explicit light/dark
// override (even starting from 'system'), matching what users expect from
// a single-click toggle. The 3-way picker (including 'system' as a
// selectable, persistent choice) lives in Settings > Appearance.
export function ThemeToggle() {
  const { resolvedTheme, setMode } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="icon-btn"
      aria-label="تبديل المظهر"
      title={isDark ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع الداكن'}
    >
      <span className="ms">{isDark ? 'light_mode' : 'dark_mode'}</span>
    </button>
  )
}
