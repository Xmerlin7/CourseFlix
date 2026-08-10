import { showToast } from '../../../shared/components/Toast'
import { useTheme, type ThemeMode } from '../../../shared/hooks/useTheme'
import { useSettings } from '../hooks/useSettings'

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: 'فاتح', icon: 'light_mode' },
  { value: 'dark', label: 'داكن', icon: 'dark_mode' },
  { value: 'system', label: 'حسب النظام', icon: 'brightness_auto' },
]

// Theme is applied locally (instant, via useTheme's localStorage + DOM
// class) independently of the account PATCH — a slow/failed save never
// blocks the visual change, it just means the choice won't follow you to
// another device yet.
export function AppearanceSettingsForm() {
  const { mode, setMode } = useTheme()
  const { setTheme, isSaving } = useSettings()

  async function handleSelect(next: ThemeMode) {
    setMode(next)
    try {
      await setTheme(next)
    } catch {
      showToast('اتحفظ المظهر على جهازك، بس حصل خطأ أثناء حفظه في حسابك', 'error')
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: 0 }}>مظهر التطبيق</h3>
      <p className="meta">اختار المظهر اللي يناسبك — التغيير بيتطبّق فورًا.</p>

      <div className="actions section">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isSaving}
            onClick={() => void handleSelect(option.value)}
            className={`chip clickable outline${mode === option.value ? ' selected' : ''}`}
            aria-pressed={mode === option.value}
          >
            <span className="ms">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
