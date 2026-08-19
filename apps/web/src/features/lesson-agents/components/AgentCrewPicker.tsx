import { Link } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'

export interface AgentCrewSelection {
  handout: boolean
  quiz: boolean
  notifier: boolean
}

interface AgentCrewPickerProps {
  value: AgentCrewSelection
  onChange: (next: AgentCrewSelection) => void
  disabled?: boolean
}

/**
 * Picks which optional agents run, at the moment the teacher launches
 * them.
 *
 * The same two switches exist in Settings, but that's the wrong place to
 * only have them: the decision ("this lesson is five minutes long, skip
 * the handout") is made per lesson, while the teacher is looking at the
 * lesson. Toggling here sends a per-run override and never rewrites the
 * saved default — the settings link is there for changing that.
 *
 * The three mandatory agents are shown too, locked. Listing only the
 * optional two would imply they're the whole crew, and the locked chips
 * are what make "you can't turn transcription off" visible instead of
 * merely true.
 */
export function AgentCrewPicker({ value, onChange, disabled }: AgentCrewPickerProps) {
  const optional = [
    {
      key: 'handout' as const,
      label: 'كاتب الشرح',
      icon: 'menu_book',
      on: value.handout,
    },
    {
      key: 'quiz' as const,
      label: 'واضع الأسئلة',
      icon: 'quiz',
      on: value.quiz,
    },
    {
      key: 'notifier' as const,
      label: 'مراسل البريد',
      icon: 'mail',
      on: value.notifier,
    },
  ]

  return (
    <div className="agent-crew-picker">
      <span className="meta">الفريق اللي هيشتغل على الدرس ده:</span>

      <div className="agent-crew-picker-row">
        <span className="chip green" title="بيشتغلوا دايمًا — من غيرهم الطالب مش هيقدر يسأل في الدرس">
          <span className="ms sm">lock</span>
          تفريغ · مراجعة · فهرسة
        </span>

        {optional.map((agent) => (
          <button
            key={agent.key}
            type="button"
            role="switch"
            aria-checked={agent.on}
            disabled={disabled}
            className={`chip clickable${agent.on ? ' selected' : ' outline'}`}
            onClick={() => onChange({ ...value, [agent.key]: !agent.on })}
          >
            <span className="ms sm">{agent.on ? 'check' : 'add'}</span>
            <span className="ms sm">{agent.icon}</span>
            {agent.label}
          </button>
        ))}
      </div>

      <span className="meta">
        الاختيار ده للدرس ده بس.{' '}
        <Link to={ROUTE_PATHS.TEACHER.SETTINGS} className="meta-link">
          غيّر الافتراضي من الإعدادات
        </Link>
      </span>
    </div>
  )
}
