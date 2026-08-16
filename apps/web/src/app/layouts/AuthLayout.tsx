import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'
import '../../features/auth/auth.css'
import { AuthArtwork } from '../../features/auth/components/AuthArtwork'

const HIGHLIGHTS = [
  { icon: 'play_lesson', text: 'حصص منظّمة درس بدرس' },
  { icon: 'auto_awesome', text: 'مساعد ذكي يجاوب من داخل الشرح' },
  { icon: 'trending_up', text: 'متابعة لتقدّمك أول بأول' },
]

/**
 * Shell for /login and /register: a form column and a showcase column.
 *
 * The form comes first in the DOM on purpose. The document is dir="rtl", so
 * that also places it on the right — but the ordering is about assistive
 * tech and keyboard users reaching the actual task before the showcase,
 * not about which side it lands on.
 *
 * Both columns scroll independently and centre their content only when
 * there is room for it (see the `margin-block: auto` note in auth.css) —
 * the register wizard on a short laptop window is taller than the viewport,
 * and centring it with `justify-content` put its top and bottom edges
 * permanently out of reach.
 */
export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="cfa-shell">
      <main className="cfa-main">
        <div className="cfa-form-col">
          <span className="cfa-wordmark">COURSEFLIX</span>

          {children ?? <Outlet />}

          <p className="cfa-foot">جميع الحقوق محفوظة لمنصة CourseFlix · 2026</p>
        </div>
      </main>

      <aside className="cfa-aside" aria-label="نبذة عن المنصة">
        <AuthArtwork />
        <span className="cfa-veil" aria-hidden="true" />

        <div className="cfa-aside-inner">
          <h2 className="cfa-aside-title">
            ذاكر بطريقة
            <br />
            تخلّيك فاهم
          </h2>

          <p className="cfa-aside-text">
            اسأل وانت جوّه الحصة، وخد إجابة مربوطة بالثانية اللي اتشرحت فيها.
          </p>

          <ul className="cfa-points">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight.icon}>
                <span className="ms" aria-hidden="true">
                  {highlight.icon}
                </span>
                {highlight.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
