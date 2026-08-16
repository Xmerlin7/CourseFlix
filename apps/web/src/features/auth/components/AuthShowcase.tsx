import { useEffect, useState } from 'react'
import './AuthShowcase.css'

interface ScriptLine {
  role: 'student' | 'tutor'
  text: string
  /** Timestamp the tutor's answer is grounded in, shown as a citation. */
  cite?: string
}

/*
 * A scripted exchange, not a live one. It shows the thing the product is
 * actually built around — an assistant that answers out of the lesson the
 * student is sitting in, and cites the second of the video it came from —
 * which is far more use of this panel than a static marketing card was.
 */
const SCRIPT: ScriptLine[] = [
  { role: 'student', text: 'مش فاهم قانون كولوم، ممكن تبسطهولي؟' },
  {
    role: 'tutor',
    text: 'القوة بين شحنتين بتزيد لما الشحنات تكبر، وبتقل بسرعة لما المسافة بينهم تزيد — بمربع المسافة مش بالمسافة نفسها.',
    cite: '٠٤:١٢',
  },
  { role: 'student', text: 'طب إمتى تكون تجاذب وإمتى تنافر؟' },
  {
    role: 'tutor',
    text: 'لو الشحنتين مختلفتين في الإشارة بيتجاذبوا، ولو متشابهتين بيتنافروا. نفس القانون، بس اتجاه القوة بيختلف.',
    cite: '٠٦:٣٠',
  },
]

const STATS = [
  { value: '٤٨', label: 'تدريب قصير' },
  { value: '١٢', label: 'أسبوع خطة' },
  { value: '٢٤/٧', label: 'مساعد جاهز' },
]

/**
 * Read the motion preference without owning it.
 *
 * `useReducedMotion` in shared/hooks is the *settings* hook — it writes the
 * `data-reduce-motion` attribute and localStorage on mount. Calling it from
 * a display component would have this panel racing the Settings page for
 * ownership of that attribute, so this reads the resolved state instead:
 * the in-app toggle (the attribute) or the OS preference.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    const resolve = () =>
      setReduced(
        query.matches ||
          document.documentElement.getAttribute('data-reduce-motion') === '1',
      )

    resolve()
    query.addEventListener('change', resolve)

    // The in-app toggle flips an attribute, which fires no media event.
    const observer = new MutationObserver(resolve)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-reduce-motion'],
    })

    return () => {
      query.removeEventListener('change', resolve)
      observer.disconnect()
    }
  }, [])

  return reduced
}

/**
 * The showcase panel's centrepiece: a looping demo of the AI tutor
 * answering from inside a lesson.
 *
 * Replaces the admin-configured course card, which cost a settings screen,
 * three hooks, a controller trio and a database table to render what was,
 * in the end, a picture of a course.
 */
export function AuthShowcase() {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    // No animation: present the finished conversation and stop.
    if (reduced) {
      setShown(SCRIPT.length)
      setIsTyping(false)
      return
    }

    if (shown >= SCRIPT.length) {
      const restart = setTimeout(() => setShown(0), 4200)
      return () => clearTimeout(restart)
    }

    // The assistant "thinks" before it answers; the student does not.
    if (SCRIPT[shown].role === 'tutor') {
      setIsTyping(true)
      const reply = setTimeout(() => {
        setIsTyping(false)
        setShown((current) => current + 1)
      }, 1250)
      return () => clearTimeout(reply)
    }

    const next = setTimeout(() => setShown((current) => current + 1), 900)
    return () => clearTimeout(next)
  }, [shown, reduced])

  // The lesson clock follows the conversation: it reads the timestamp of
  // the most recent answer, so the video and the thread stay in step.
  const currentCite =
    SCRIPT.slice(0, shown)
      .filter((line) => line.cite)
      .at(-1)?.cite ?? '٠٠:٤٥'

  return (
    <div className="cfs">
      <div className="cfs-panel">
        <header className="cfs-lesson">
          <span className="cfs-thumb" aria-hidden="true">
            <span className="ms">play_arrow</span>
          </span>

          <span className="cfs-lesson-text">
            <strong>قانون كولوم</strong>
            <small>الفيزياء · الفصل الأول</small>
          </span>

          <span className="cfs-clock">{currentCite}</span>
        </header>

        <div className="cfs-scrub" aria-hidden="true">
          <i />
        </div>

        <div className="cfs-thread">
          {SCRIPT.slice(0, shown).map((line, index) => (
            <div key={index} className={`cfs-msg ${line.role}`}>
              <p>{line.text}</p>
              {line.cite && (
                <span className="cfs-cite">
                  <span className="ms" aria-hidden="true">
                    play_circle
                  </span>
                  من الفيديو · {line.cite}
                </span>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="cfs-msg tutor typing">
              <span className="cfs-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>

        <footer className="cfs-composer" aria-hidden="true">
          <span className="ms">auto_awesome</span>
          اسأل المساعد عن أي حاجة في الحصة
        </footer>
      </div>

      <ul className="cfs-stats">
        {STATS.map((stat) => (
          <li key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
