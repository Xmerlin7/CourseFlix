import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'
import '../../features/auth/auth.css'
import { AuthCourseStrip, TeacherPoster } from '../../features/auth/components/TeacherPoster'
import { useAuthPoster } from '../../features/auth/hooks/useAuthPoster'

const HIGHLIGHTS = [
  { icon: 'play_lesson', text: 'حصص مسجّلة منظّمة درس بدرس' },
  { icon: 'neurology', text: 'مساعد ذكي يجاوب على أسئلتك من داخل الشرح' },
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
 * The showcase is decorative + promotional only. Every route below renders
 * a complete, usable screen on its own, which is what lets the panel be
 * dropped wholesale under 940px rather than reflowed into the scroll.
 */
export function AuthLayout({ children }: PropsWithChildren) {
  const poster = useAuthPoster()

  return (
    <div className="cfa-shell">
      <main className="cfa-main">
        <div className="cfa-form-col">
          <span className="cfa-wordmark">COURSEFLIX</span>

          {/* Only rendered under the showcase breakpoint — see auth.css. */}
          <AuthCourseStrip content={poster.data} />

          {children ?? <Outlet />}

          <p className="cfa-foot">جميع الحقوق محفوظة لمنصة CourseFlix · 2026</p>
        </div>
      </main>

      <aside className="cfa-aside" aria-label="الدورة المميزة">
        <span className="cfa-orb one" aria-hidden="true" />
        <span className="cfa-orb two" aria-hidden="true" />
        <span className="cfa-grain" aria-hidden="true" />

        <div className="cfa-aside-head">
          <span className="cfa-aside-mark">COURSEFLIX</span>
          <h2 className="cfa-aside-title">ذاكر بطريقة تخلّيك فاهم، مش بس حافظ</h2>
          <p className="cfa-aside-text">
            منصة تجمع حصص أستاذك، تدريباتك، ومتابعة تقدّمك في مكان واحد — عشان تعرف
            دايمًا إنت واقف فين وخطوتك الجاية إيه.
          </p>
        </div>

        <TeacherPoster content={poster.data} isLoading={poster.isLoading} />

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
      </aside>
    </div>
  )
}
