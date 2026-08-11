import { Switch } from '../../../shared/components/Switch'
import { useDensity, DENSITIES, type Density } from '../../../shared/hooks/useDensity'
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion'
import { useSidebarCollapsed } from '../../../shared/hooks/useSidebarCollapsed'
import { useUiScale, UI_SCALES, type UiScale } from '../../../shared/hooks/useUiScale'

const DENSITY_LABEL: Record<Density, { label: string; hint: string }> = {
  comfortable: { label: 'مريحة', hint: 'مسافات واسعة وأسهل قراءة' },
  compact: { label: 'مضغوطة', hint: 'مسافات أقل، تشوف محتوى أكتر بدون تمرير' },
}

const UI_SCALE_LABEL: Record<UiScale, string> = {
  small: 'صغير',
  default: 'افتراضي',
  large: 'كبير',
}

// All three preferences here are client-side only (localStorage), same
// reasoning as Appearance's accent/corners — they're UI chrome behavior,
// not account data that needs to follow you to another device.
export function ExperienceSettingsForm() {
  const { isCollapsed, setCollapsed } = useSidebarCollapsed()
  const { reduceMotion, setReduceMotion } = useReducedMotion()
  const { density, setDensity } = useDensity()
  const { scale, setScale } = useUiScale()

  return (
    <div className="settings-cards-grid">
      <div className="card settings-card">
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

      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>كثافة العرض</h3>
        <p className="meta">تحكّم في المسافات بين عناصر القوائم والكروت وصناديق الإدخال.</p>

        <div className="actions section" style={{ marginBottom: 0 }}>
          {DENSITIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDensity(option)}
              className={`chip clickable outline${density === option ? ' selected' : ''}`}
              aria-pressed={density === option}
              title={DENSITY_LABEL[option].hint}
            >
              <span className="ms">{option === 'compact' ? 'density_small' : 'density_medium'}</span>
              {DENSITY_LABEL[option].label}
            </button>
          ))}
        </div>
      </div>

      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>حجم الواجهة</h3>
        <p className="meta">يكبّر أو يصغّر محتوى الصفحة والشريط الجانبي معًا — التنبيهات والنوافذ المنبثقة بتفضل بنفس الحجم.</p>

        <div className="actions section" style={{ marginBottom: 0 }}>
          {UI_SCALES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScale(option)}
              className={`chip clickable outline${scale === option ? ' selected' : ''}`}
              aria-pressed={scale === option}
            >
              <span className="ms">format_size</span>
              {UI_SCALE_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>الحركة والتأثيرات</h3>
        <p className="meta">قلّل الحركة والانتقالات في كل الواجهة — مفيد لو الحركة بتضايقك أو بتبطّئ جهازك.</p>

        <div className="settings-row" style={{ padding: '4px 0 0' }}>
          <div className="lbl-group">
            <span className="t">تقليل الحركة</span>
          </div>
          <Switch checked={reduceMotion} onChange={setReduceMotion} label="تقليل الحركة والتأثيرات" />
        </div>
      </div>
    </div>
  )
}
