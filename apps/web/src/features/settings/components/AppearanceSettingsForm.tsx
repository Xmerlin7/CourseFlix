import { showToast } from '../../../shared/components/Toast'
import { useAccentColor } from '../../../shared/hooks/useAccentColor'
import { useCornerStyle, CORNER_STYLES, type CornerStyle } from '../../../shared/hooks/useCornerStyle'
import { useTheme, type ThemeMode } from '../../../shared/hooks/useTheme'
import { ACCENT_PRESETS, hexToHue, hueToHex } from '../../../shared/lib/accent-theme'
import { useSettings } from '../hooks/useSettings'

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: 'فاتح', icon: 'light_mode' },
  { value: 'dark', label: 'داكن', icon: 'dark_mode' },
  { value: 'system', label: 'حسب النظام', icon: 'brightness_auto' },
]

const CORNER_LABEL: Record<CornerStyle, string> = {
  sharp: 'حادة',
  default: 'كلاسيكية',
  round: 'دائرية',
}

// Preview px per preset — same relative scale as --radius-scale, applied
// here to a fixed 22px reference (.card's own base radius).
const CORNER_PREVIEW_RADIUS: Record<CornerStyle, number> = {
  sharp: 0,
  default: 14,
  round: 20,
}

// Theme is applied locally (instant, via useTheme's localStorage + DOM
// class) independently of the account PATCH — a slow/failed save never
// blocks the visual change, it just means the choice won't follow you to
// another device yet. Accent/corners are pure client-side look
// preferences (no server round-trip, no account column) — see each
// hook's own doc comment for why.
export function AppearanceSettingsForm() {
  const { mode, setMode } = useTheme()
  const { setTheme, isSaving } = useSettings()
  const { hue, setHue } = useAccentColor()
  const { corners, setCorners } = useCornerStyle()

  async function handleThemeSelect(next: ThemeMode) {
    setMode(next)
    try {
      await setTheme(next)
    } catch {
      showToast('اتحفظ المظهر على جهازك، بس حصل خطأ أثناء حفظه في حسابك', 'error')
    }
  }

  return (
    <div className="settings-cards-grid">
      <div className="card">
        <h3 style={{ marginBottom: 0 }}>وضع المظهر</h3>
        <p className="meta">فاتح، داكن، أو بيتابع نظام تشغيلك تلقائيًا.</p>

        <div className="actions section" style={{ marginBottom: 0 }}>
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isSaving}
              onClick={() => void handleThemeSelect(option.value)}
              className={`chip clickable outline${mode === option.value ? ' selected' : ''}`}
              aria-pressed={mode === option.value}
            >
              <span className="ms">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 0 }}>لون التطبيق</h3>
        <p className="meta">
          اختار أي لون تحبه — بيتطبق على كل حاجة في التطبيق: الأزرار، الخلفيات، الكروت، والقوائم.
        </p>

        <div className="accent-swatches">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className={`accent-swatch${hue === preset.hue ? ' selected' : ''}`}
              style={{ background: hueToHex(preset.hue) }}
              onClick={() => setHue(preset.hue)}
              aria-pressed={hue === preset.hue}
              aria-label={preset.label}
              title={preset.label}
            >
              {hue === preset.hue && <span className="ms">check</span>}
            </button>
          ))}

          <label className="accent-swatch accent-swatch-custom" title="لون مخصص">
            <input
              type="color"
              value={hueToHex(hue)}
              onChange={(event) => setHue(hexToHue(event.target.value))}
              aria-label="اختيار لون مخصص"
            />
            <span className="ms">palette</span>
          </label>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 0 }}>استدارة الحواف</h3>
        <p className="meta">شكل زوايا الكروت وصناديق الإدخال والنوافذ المنبثقة.</p>

        <div className="actions section" style={{ marginBottom: 0 }}>
          {CORNER_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setCorners(style)}
              className={`chip clickable outline${corners === style ? ' selected' : ''}`}
              aria-pressed={corners === style}
            >
              <span
                className="corner-swatch"
                style={{ borderRadius: CORNER_PREVIEW_RADIUS[style] }}
                aria-hidden="true"
              />
              {CORNER_LABEL[style]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
