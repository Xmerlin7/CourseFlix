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
      <div className="flex flex-col gap-4 p-6">
        <h1 className="page-title">اختبار مراجعة</h1>
        <div
          className={`rounded-lg p-4 text-center ${
            passed
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          }`}
        >
          <p
            className={`text-3xl font-bold ${
              passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            {result.score} من {result.total}
          </p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {passed ? 'أحسنت! راجعت المفاهيم بنجاح.' : 'حاول مراجعة الدرس مرة أخرى.'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {quiz.questions.map((q) => {
            const res = result.answers.find((a) => a.questionId === q.id)
            return (
              <div
                key={q.id}
                className={`rounded-lg border p-4 ${
                  res?.isCorrect
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                    : 'border-red-300 bg-red-50 dark:bg-red-900/10'
                }`}
              >
                <p className="font-medium">{q.text}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {res?.isCorrect ? 'إجابة صحيحة ✓' : 'إجابة خاطئة ✗'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      <h1 className="page-title">اختبار مراجعة</h1>
      <p className="page-subtitle">{quiz.weakConcept}</p>
      {quiz.questions.map((q, index) => (
        <div key={q.id} className="rounded-lg border p-4">
          <p className="mb-3 font-medium">
            {index + 1}. {q.text}
          </p>
          <div className="flex flex-col gap-2">
            {(q.options ?? []).map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
              >
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  checked={answers[q.id] === opt}
                  className="accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="submit"
        disabled={isSubmitting || Object.keys(answers).length !== quiz.questions.length}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'جاري التصحيح...' : 'إرسال الإجابات'}
      </button>
    </form>
  )
}
