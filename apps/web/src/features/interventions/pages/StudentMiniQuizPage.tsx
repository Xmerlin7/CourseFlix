import { useState } from 'react'
import { useParams } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { useMiniQuiz } from '../hooks/useMiniQuiz'

export function StudentMiniQuizPage() {
  const { miniQuizId } = useParams<{ miniQuizId: string }>()
  const { quiz, isLoading, isSubmitting, error, result, submit } = useMiniQuiz(
    miniQuizId ?? null,
  )
  const [answers, setAnswers] = useState<Record<string, string>>({})

  if (isLoading) return <LoadingState />
  if (error?.status === 403) return <ForbiddenState />
  if (error?.status === 404) return <NotFoundState />
  if (error) return <ErrorState />
  if (!quiz) return <LoadingState />

  if (result) {
    const passed = result.score >= Math.ceil(result.total / 2)
    return (
      <>
        <h1 className="page-title">اختبار مراجعة</h1>

        <div className={`result-banner ${passed ? 'pass' : 'fail'}`} role="status">
          <p className="score">
            {result.score} من {result.total}
          </p>
          <p>{passed ? 'أحسنت! راجعت المفاهيم بنجاح.' : 'حاول مراجعة الدرس مرة أخرى.'}</p>
        </div>

        <div className="section">
          {quiz.questions.map((q, index) => {
            const res = result.answers.find((a) => a.questionId === q.id)
            return (
              <div key={q.id} className="qcard">
                <p className="qnum">سؤال {index + 1}</p>
                <p className="qtext">{q.text}</p>
                <div className={`opt ${res?.isCorrect ? 'correct' : 'incorrect'}`}>
                  <span className="ms sm">{res?.isCorrect ? 'check_circle' : 'cancel'}</span>
                  {res?.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formatted = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }))
    await submit(formatted)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="page-title">اختبار مراجعة</h1>
      <p className="subtitle">{quiz.weakConcept}</p>

      {quiz.questions.map((q, index) => (
        <div key={q.id} className="qcard">
          <p className="qnum">سؤال {index + 1}</p>
          <p className="qtext">{q.text}</p>
          {(q.options ?? []).map((opt) => (
            <label key={opt} className={`opt${answers[q.id] === opt ? ' selected' : ''}`}>
              <input
                type="radio"
                name={q.id}
                value={opt}
                onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                checked={answers[q.id] === opt}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button
        type="submit"
        className="btn big"
        disabled={isSubmitting || Object.keys(answers).length !== quiz.questions.length}
        style={{ width: '100%' }}
      >
        <span className="ms">quiz</span>
        {isSubmitting ? 'جاري التصحيح...' : 'إرسال الإجابات'}
      </button>
    </form>
  )
}
