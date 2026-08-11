import { useEffect, useState } from 'react'
import { showToast } from '../../../shared/components/Toast'
import { useAccentColor } from '../../../shared/hooks/useAccentColor'
import { useCornerStyle, CORNER_STYLES, type CornerStyle } from '../../../shared/hooks/useCornerStyle'
import { useFontFamily, FONT_FAMILIES, type FontFamily } from '../../../shared/hooks/useFontFamily'
import { useTheme, type ThemeMode } from '../../../shared/hooks/useTheme'
import { DEFAULT_ACCENT_HEX, isValidHex } from '../../../shared/lib/accent-theme'
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

const FONT_LABEL: Record<FontFamily, string> = {
  cairo: 'Cairo',
  tajawal: 'Tajawal',
  almarai: 'Almarai',
  'ibm-plex': 'IBM Plex Sans Arabic',
  'noto-kufi': 'Noto Kufi Arabic',
}

// The literal font-family name each option applies — must match the
// --font-family values in index.css's [data-font="..."] overrides, and
// the family names loaded by index.html's Google Fonts <link>.
const FONT_STACK: Record<FontFamily, string> = {
  cairo: '"Cairo", sans-serif',
  tajawal: '"Tajawal", sans-serif',
  almarai: '"Almarai", sans-serif',
  'ibm-plex': '"IBM Plex Sans Arabic", sans-serif',
  'noto-kufi': '"Noto Kufi Arabic", sans-serif',
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
  const { hex, setHex } = useAccentColor()
  const { corners, setCorners } = useCornerStyle()
  const { font, setFont } = useFontFamily()

  // Local, freely-typeable copy of the hex text field — it can't just be
  // controlled by `hex` directly, since an in-progress value like "#65"
  // isn't valid yet and setHex() would never run, which meant React kept
  // snapping the field back to the last full value on every keystroke.
  // Re-synced whenever `hex` changes from elsewhere (the color swatch).
  const [hexInput, setHexInput] = useState(hex.toUpperCase())
  useEffect(() => setHexInput(hex.toUpperCase()), [hex])

  async function handleThemeSelect(next: ThemeMode) {
    setMode(next)
    try {
      await setTheme(next)
    } catch {
      showToast('اتحفظ المظهر على جهازك، بس حصل خطأ أثناء حفظه في حسابك', 'error')
    }
  }

  function handleHexInputChange(value: string) {
    setHexInput(value)
    const withHash = value.startsWith('#') ? value : `#${value}`
    if (isValidHex(withHash)) setHex(withHash)
  }

  return (
    <div className="settings-cards-grid">
      <div className="card settings-card">
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

      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>لون التطبيق</h3>
        <p className="meta">
          اختار أي لون تحبه — بيتطبق على كل حاجة في التطبيق: الأزرار، الخلفيات، الكروت، والقوائم.
        </p>

        <div className="color-picker-field">
          <label className="color-picker-swatch" style={{ background: hex }}>
            <input
              type="color"
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              aria-label="اختيار لون التطبيق"
            />
          </label>

          <div className="tf" style={{ flex: 1, margin: 0 }}>
            <label htmlFor="accent-hex-input">كود اللون</label>
            <input
              id="accent-hex-input"
              type="text"
              value={hexInput}
              spellCheck={false}
              maxLength={7}
              onChange={(event) => handleHexInputChange(event.target.value)}
            />
          </div>
        </div>

        {hex !== DEFAULT_ACCENT_HEX && (
          <button type="button" className="btn text btn-compact" onClick={() => setHex(DEFAULT_ACCENT_HEX)}>
            <span className="ms">restart_alt</span>
            استعادة اللون الافتراضي
          </button>
        )}
      </div>

      <div className="card settings-card">
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

      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>خط الواجهة</h3>
        <p className="meta">اختار الخط العربي اللي يريحك أكتر في القراءة.</p>

        <div className="font-options">
          {FONT_FAMILIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFont(option)}
              className={`font-option${font === option ? ' selected' : ''}`}
              style={{ fontFamily: FONT_STACK[option] }}
              aria-pressed={font === option}
            >
              <span className="font-option-sample">أبجد هوز</span>
              <span className="font-option-label">{FONT_LABEL[option]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
