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
    const passed = result.score >= Math.ceil(result.total / 2);
    return (
      <>
        <h1 className="page-title">{quiz.title}</h1>

        <div className={`result-banner ${passed ? 'pass' : 'fail'}`} role="status">
          <p className="score">
            {result.score} / {result.total}
          </p>
          <p>{passed ? 'أحسنت! نتيجتك ممتازة.' : 'حاول مراجعة الدرس والإعادة مرة أخرى.'}</p>
        </div>

        <div className="section">
          {quiz.questions.map((q, index) => {
            const res = result.answers.find((a) => a.questionId === q.id);
            const userAnswer = answers[q.id] || 'بدون إجابة';
            return (
              <div key={q.id} className="qcard">
                <p className="qnum">سؤال {index + 1}</p>
                <p className="qtext">{q.text}</p>
                <div className={`opt ${res?.isCorrect ? 'correct' : 'incorrect'}`}>
                  <span className="ms sm">{res?.isCorrect ? 'check_circle' : 'cancel'}</span>
                  إجابتك: {userAnswer}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
    await submit(formatted);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="page-title">{quiz.title}</h1>
      <p className="subtitle">أجب عن كل الأسئلة ثم أرسل الاختبار</p>

      {quiz.questions.map((q, index) => (
        <div key={q.id} className="qcard">
          <p className="qnum">سؤال {index + 1}</p>
          <p className="qtext">{q.text}</p>
          {q.options.map((opt) => (
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

      <button type="submit" className="btn big" disabled={isSubmitting} style={{ width: '100%' }}>
        <span className="ms">quiz</span>
        {isSubmitting ? 'جاري التصحيح...' : 'إرسال الإجابات'}
      </button>
    </form>
  );
}
