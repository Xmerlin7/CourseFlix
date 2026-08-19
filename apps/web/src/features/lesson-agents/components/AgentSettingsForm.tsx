import { useState } from 'react'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Switch } from '../../../shared/components/Switch'
import { showToast } from '../../../shared/components/Toast'
import { useAgentSettings } from '../hooks/useAgentSettings'
import type {
  AgentQuizDifficulty,
  HandoutDetailLevel,
  UpdateAgentSettingsPayload,
} from '../types/lesson-agents.types'

const DETAIL_LEVEL_LABELS: Record<HandoutDetailLevel, string> = {
  concise: 'مختصر — الفكرة وأهم نقطة أو اتنين',
  standard: 'متوازن — شرح وافٍ ومثال لكل فكرة',
  deep: 'مفصّل — كل زاوية وحالة خاصة وخطأ شائع',
}

const DIFFICULTY_LABELS: Record<AgentQuizDifficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

interface NumberSettingProps {
  id: string
  label: string
  hint: string
  value: number
  min: number
  max: number
  disabled: boolean
  onCommit: (value: number) => void
}

/**
 * A numeric setting that saves when the teacher is *done*, not on every
 * keystroke.
 *
 * Binding a number input straight to server state and PATCHing in
 * `onChange` sends one write per character — typing "12" saved 1 and then
 * 12 — and it also fights the teacher: clearing the field to retype it
 * produces `Number('') === 0`, which a range guard rejects, so the old
 * value snaps back mid-edit. Keeping a local draft and committing on blur
 * or Enter fixes both, and the clamp means an out-of-range draft is
 * corrected rather than silently dropped.
 */
function NumberSetting({
  id,
  label,
  hint,
  value,
  min,
  max,
  disabled,
  onCommit,
}: NumberSettingProps) {
  // Seeded once per mount. Re-syncing to a changed `value` is handled by
  // the caller remounting this via `key` rather than by an effect that
  // writes state — the saved value only ever changes *after* a commit, so
  // a remount then is exactly the intent, and it can never interrupt
  // someone mid-edit.
  const [draft, setDraft] = useState(String(value))

  function commit() {
    const parsed = Number(draft)
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      return
    }

    const clamped = Math.min(max, Math.max(min, Math.round(parsed)))
    setDraft(String(clamped))
    if (clamped !== value) {
      onCommit(clamped)
    }
  }

  return (
    <div className="tf">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
        }}
      />
      <span className="meta">{hint}</span>
    </div>
  )
}

/**
 * The teacher's standing instructions to the agent crew.
 *
 * Only the two optional agents are configurable. The transcriber,
 * reviewer and indexer have no switch anywhere in the product — turning
 * them off would leave a lesson the student assistant can't answer
 * questions about, which is the guarantee the whole pipeline is built
 * around, so the form says that outright rather than hiding it.
 */
export function AgentSettingsForm() {
  const { data, isLoading, isSaving, error, save, refetch } = useAgentSettings()

  if (isLoading) {
    return (
      <div className="card skeleton-pulse" role="status" aria-label="جاري تحميل الإعدادات">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="settings-row">
            <span className="skeleton" style={{ height: 15, width: '45%', borderRadius: 6 }} />
            <span className="skeleton" style={{ height: 30, width: 64, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState title="تعذر تحميل إعدادات الوكلاء" message="حاول مرة أخرى" onRetry={refetch} />
  }

  const settings = data

  async function apply(payload: UpdateAgentSettingsPayload) {
    try {
      await save(payload)
    } catch {
      showToast('حصل خطأ، حاول تاني', 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>الوكلاء الأساسيون</h3>
        <p className="meta">
          دول شغّالين على طول ومش بيتقفلوا: التفريغ، المراجعة، والفهرسة. من غيرهم مش هيقدر
          الطالب يسأل المساعد الذكي في الدرس.
        </p>
        <div className="settings-row">
          <div className="lbl-group">
            <span className="t">
              <span className="ms" style={{ fontSize: 18, verticalAlign: 'middle', marginInlineEnd: 6 }}>
                graphic_eq
              </span>
              المُفرِّغ · المُراجِع · المُفهرِس
            </span>
          </div>
          <span className="chip green">
            <span className="ms sm">lock</span>
            دائمًا
          </span>
        </div>
      </div>

      <div className="card settings-card">
        <div className="settings-row">
          <div className="lbl-group">
            <span className="t">
              <span className="ms" style={{ fontSize: 18, verticalAlign: 'middle', marginInlineEnd: 6 }}>
                menu_book
              </span>
              كاتب الشرح
            </span>
            <span className="meta">يكتب مذكّرة شرح للدرس ويطلعها PDF باسم الدرس.</span>
          </div>
          <Switch
            checked={settings.handoutEnabled}
            disabled={isSaving}
            onChange={(checked) => void apply({ handoutEnabled: checked })}
            label="تفعيل كاتب الشرح"
          />
        </div>

        {settings.handoutEnabled && (
          <>
            <NumberSetting
              key={`handout-pages-${settings.handoutPageCount}`}
              id="handout-pages"
              label="عدد صفحات المذكّرة"
              hint="من صفحة لـ ١٢ صفحة. كل صفحة = محور من محاور الدرس."
              value={settings.handoutPageCount}
              min={1}
              max={12}
              disabled={isSaving}
              onCommit={(value) => void apply({ handoutPageCount: value })}
            />

            <div className="tf">
              <label htmlFor="handout-detail">مستوى التفاصيل</label>
              <select
                id="handout-detail"
                value={settings.handoutDetailLevel}
                disabled={isSaving}
                onChange={(event) =>
                  void apply({
                    handoutDetailLevel: event.target.value as HandoutDetailLevel,
                  })
                }
              >
                {(Object.keys(DETAIL_LEVEL_LABELS) as HandoutDetailLevel[]).map((level) => (
                  <option key={level} value={level}>
                    {DETAIL_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
              <span className="meta">بيحدد قد إيه الوكيل يفصّل في كل فكرة، مش أسلوب كتابته.</span>
            </div>

            <div className="settings-row">
              <div className="lbl-group">
                <span className="t">أمثلة محلولة</span>
              </div>
              <Switch
                checked={settings.handoutIncludeExamples}
                disabled={isSaving}
                onChange={(checked) => void apply({ handoutIncludeExamples: checked })}
                label="تضمين أمثلة محلولة"
              />
            </div>

            <div className="settings-row">
              <div className="lbl-group">
                <span className="t">قسم المصطلحات الأساسية</span>
              </div>
              <Switch
                checked={settings.handoutIncludeKeyTerms}
                disabled={isSaving}
                onChange={(checked) => void apply({ handoutIncludeKeyTerms: checked })}
                label="تضمين قسم المصطلحات"
              />
            </div>

            <div className="settings-row">
              <div className="lbl-group">
                <span className="t">ملخّص في آخر المذكّرة</span>
              </div>
              <Switch
                checked={settings.handoutIncludeSummary}
                disabled={isSaving}
                onChange={(checked) => void apply({ handoutIncludeSummary: checked })}
                label="تضمين ملخّص نهائي"
              />
            </div>
          </>
        )}
      </div>

      <div className="card settings-card">
        <div className="settings-row">
          <div className="lbl-group">
            <span className="t">
              <span className="ms" style={{ fontSize: 18, verticalAlign: 'middle', marginInlineEnd: 6 }}>
                quiz
              </span>
              واضع الأسئلة
            </span>
            <span className="meta">يصيغ اختبارًا من الدرس، ومش بيتنشر غير بعد موافقتك.</span>
          </div>
          <Switch
            checked={settings.quizEnabled}
            disabled={isSaving}
            onChange={(checked) => void apply({ quizEnabled: checked })}
            label="تفعيل واضع الأسئلة"
          />
        </div>

        {settings.quizEnabled && (
          <>
            <div className="tf">
              <label htmlFor="quiz-difficulty">مستوى الأسئلة</label>
              <select
                id="quiz-difficulty"
                value={settings.quizDifficulty}
                disabled={isSaving}
                onChange={(event) =>
                  void apply({ quizDifficulty: event.target.value as AgentQuizDifficulty })
                }
              >
                {(Object.keys(DIFFICULTY_LABELS) as AgentQuizDifficulty[]).map((value) => (
                  <option key={value} value={value}>
                    {DIFFICULTY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <NumberSetting
              key={`quiz-mcq-${settings.quizMcqCount}`}
              id="quiz-mcq"
              label="عدد أسئلة الاختيار من متعدد"
              hint="حطّ صفر لو مش عايز النوع ده خالص."
              value={settings.quizMcqCount}
              min={0}
              max={30}
              disabled={isSaving}
              onCommit={(value) => void apply({ quizMcqCount: value })}
            />

            <NumberSetting
              key={`quiz-tf-${settings.quizTrueFalseCount}`}
              id="quiz-tf"
              label="عدد أسئلة صح أو خطأ"
              hint="حطّ صفر لو مش عايز النوع ده خالص."
              value={settings.quizTrueFalseCount}
              min={0}
              max={30}
              disabled={isSaving}
              onCommit={(value) => void apply({ quizTrueFalseCount: value })}
            />


            <NumberSetting
              key={`quiz-due-${settings.quizDueInDays}`}
              id="quiz-due"
              label="مدة تسليم الاختبار (أيام)"
              hint="الديدلاين بيتحسب من لحظة نشرك للاختبار."
              value={settings.quizDueInDays}
              min={1}
              max={90}
              disabled={isSaving}
              onCommit={(value) => void apply({ quizDueInDays: value })}
            />
          </>
        )}
      </div>
    </div>
  )
}
