import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'
import '../../features/auth/auth.css'
import { AuthShowcase } from '../../features/auth/components/AuthShowcase'

const HIGHLIGHTS = [
  { icon: 'play_lesson', text: 'حصص مسجّلة منظّمة درس بدرس' },
  { icon: 'neurology', text: 'مساعد ذكي يجاوب من داخل الشرح نفسه' },
  { icon: 'trending_up', text: 'متابعة لتقدّمك بعد كل حصة واختبار' },
]

/**
 * Shell for /login and /register: a form column and a showcase column.
 *
 * The form comes first in the DOM on purpose. The document is dir="rtl", so
 * that also places it on the right — but the ordering is about assistive
 * tech and keyboard users reaching the actual task before the marketing
 * panel, not about which side it lands on.
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
        <span className="cfa-orb one" aria-hidden="true" />
        <span className="cfa-orb two" aria-hidden="true" />
        <span className="cfa-grain" aria-hidden="true" />

        {/* Scroll container: the orbs above are positioned against the
            panel itself, so they must stay outside anything that moves. */}
        <div className="cfa-aside-scroll">
          <div className="cfa-aside-inner">
            <div className="cfa-aside-head">
              <h2 className="cfa-aside-title">ذاكر بطريقة تخلّيك فاهم، مش بس حافظ</h2>
              <p className="cfa-aside-text">
                اسأل وانت جوّه الحصة، وخد إجابة مربوطة بالثانية اللي اتشرحت فيها.
              </p>
            </div>

            <AuthShowcase />

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
        </div>
      </aside>
    </div>
  )
}
