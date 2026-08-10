import { showToast } from '../../../shared/components/Toast'
import { Switch } from '../../../shared/components/Switch'
import { useAccentColor, ACCENT_COLORS, type AccentColor } from '../../../shared/hooks/useAccentColor'
import { useCornerStyle, CORNER_STYLES, type CornerStyle } from '../../../shared/hooks/useCornerStyle'
import { useSidebarCollapsed } from '../../../shared/hooks/useSidebarCollapsed'
import { useTheme, type ThemeMode } from '../../../shared/hooks/useTheme'
import { useSettings } from '../hooks/useSettings'

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: 'فاتح', icon: 'light_mode' },
  { value: 'dark', label: 'داكن', icon: 'dark_mode' },
  { value: 'system', label: 'حسب النظام', icon: 'brightness_auto' },
]

// Matches each accent's light-mode --primary in index.css exactly — the
// swatch previews its own color directly since :root[data-accent] can't
// be scoped to a single child element to preview an *inactive* accent.
const ACCENT_PREVIEW: Record<AccentColor, string> = {
  violet: '#65558F',
  blue: 'hsl(215, 24%, 44%)',
  teal: 'hsl(165, 24%, 40%)',
  amber: 'hsl(35, 45%, 38%)',
  rose: 'hsl(345, 40%, 46%)',
}

const ACCENT_LABEL: Record<AccentColor, string> = {
  violet: 'بنفسجي',
  blue: 'أزرق',
  teal: 'أخضر مائي',
  amber: 'كهرماني',
  rose: 'وردي',
}

const CORNER_LABEL: Record<CornerStyle, string> = {
  sharp: 'حادة',
  default: 'كلاسيكية',
  round: 'دائرية',
}

// Preview px per preset — same relative scale as --radius-scale, applied
// here to a fixed 22px reference (.card's own base radius).
const CORNER_PREVIEW_RADIUS: Record<CornerStyle, number> = {
  sharp: 7,
  default: 14,
  round: 20,
}

// Theme is applied locally (instant, via useTheme's localStorage + DOM
// class) independently of the account PATCH — a slow/failed save never
// blocks the visual change, it just means the choice won't follow you to
// another device yet. Accent/corners/sidebar are pure client-side look
// preferences (no server round-trip, no account column) — see each
// hook's own doc comment for why.
export function AppearanceSettingsForm() {
  const { mode, setMode } = useTheme()
  const { setTheme, isSaving } = useSettings()
  const { accent, setAccent } = useAccentColor()
  const { corners, setCorners } = useCornerStyle()
  const { isCollapsed, setCollapsed } = useSidebarCollapsed()

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
        <p className="meta">اختار اللون الأساسي اللي هيظهر في الأزرار والروابط والتفاصيل.</p>

        <div className="accent-swatches">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`accent-swatch${accent === color ? ' selected' : ''}`}
              style={{ background: ACCENT_PREVIEW[color] }}
              onClick={() => setAccent(color)}
              aria-pressed={accent === color}
              aria-label={ACCENT_LABEL[color]}
              title={ACCENT_LABEL[color]}
            >
              {accent === color && <span className="ms">check</span>}
            </button>
          ))}
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

      <div className="card">
        <h3 style={{ marginBottom: 0 }}>الشريط الجانبي</h3>
        <p className="meta">ابدأ بشريط جانبي مطوي (أيقونات فقط) بدل ما يكون مفتوح بالكامل.</p>

        <div className="settings-row" style={{ padding: '4px 0 0' }}>
          <div className="lbl-group">
            <span className="t">طي الشريط الجانبي افتراضيًا</span>
          </div>
          <Switch
            checked={isCollapsed}
            onChange={setCollapsed}
            label="طي الشريط الجانبي افتراضيًا"
          />
        </div>
      </div>
    </div>
  )
}
