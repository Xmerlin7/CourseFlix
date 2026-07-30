import { useState } from 'react';
import { useParams } from 'react-router';
import { ErrorState } from '../../../shared/components/ErrorState';
import { ForbiddenState } from '../../../shared/components/ForbiddenState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { useQuiz } from '../hooks/useQuiz';

export function StudentQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { quiz, isLoading, error, refetch, submit, result, isSubmitting } = useQuiz(quizId!);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingState />;
  if (error?.status === 403) return <ForbiddenState />;
  if (error?.status === 404) return <NotFoundState />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!quiz) return <LoadingState />;

  if (result) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">
            {result.score} / {result.total}
          </p>
          <p className="text-gray-600 dark:text-gray-400">Your Result</p>
        </div>
        <div className="flex flex-col gap-3">
          {quiz.questions.map((q) => {
            const res = result.answers.find(a => a.questionId === q.id);
            const userAnswer = answers[q.id] || 'No answer';
            return (
              <div key={q.id} className={`rounded-lg border p-4 ${res?.isCorrect ? 'border-green-300 bg-green-50 dark:bg-green-900/10' : 'border-red-300 bg-red-50 dark:bg-red-900/10'}`}>
                <p className="font-medium">{q.text}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Your answer: {userAnswer} {res?.isCorrect ? '✓' : '✗'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
    await submit(formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">{quiz.title}</h1>
      {quiz.questions.map((q) => (
        <div key={q.id} className="rounded-lg border p-4">
          <p className="mb-3 font-medium">{q.text}</p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                <input type="radio" name={q.id} value={opt}
                  onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                  checked={answers[q.id] === opt}
                  className="accent-blue-600" />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button type="submit" disabled={isSubmitting}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50">
        {isSubmitting ? 'Grading...' : 'Submit Answers'}
      </button>
    </form>
  );
}
