import { useState } from 'react';
import { useParams } from 'react-router';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { ForbiddenState } from '../../../shared/components/ForbiddenState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { useQuiz } from '../hooks/useQuiz';
import type { QuizQuestion, QuizResult } from '../types/quiz.types';

interface QuestionNavGridProps {
  questions: QuizQuestion[];
  currentIndex: number;
  onSelect: (index: number) => void;
  // Exam-taking mode reads `answers`; review mode reads `result` instead —
  // never both, so the cell state source is unambiguous per render.
  answers?: Record<string, string>;
  result?: QuizResult;
}

function QuestionNavGrid({ questions, currentIndex, onSelect, answers, result }: QuestionNavGridProps) {
  return (
    <div className="quiz-nav-grid">
      {questions.map((question, index) => {
        const isCurrent = index === currentIndex;
        let stateClass = '';
        let stateLabel = 'لم تتم الإجابة';
        if (result) {
          const isCorrect = result.answers.find((a) => a.questionId === question.id)?.isCorrect;
          stateClass = isCorrect ? 'correct' : 'incorrect';
          stateLabel = isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة';
        } else if (answers?.[question.id]) {
          stateClass = 'answered';
          stateLabel = 'تمت الإجابة';
        }

        return (
          <button
            key={question.id}
            type="button"
            className={`quiz-nav-cell ${isCurrent ? 'current' : ''} ${stateClass}`}
            onClick={() => onSelect(index)}
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={`سؤال ${index + 1} - ${stateLabel}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}

export function StudentQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { quiz, isLoading, error, refetch, submit, result, isSubmitting } = useQuiz(quizId!);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error?.status === 403) return <ForbiddenState />;
  if (error?.status === 404) return <NotFoundState />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!quiz) return <LoadingState />;

  const totalQuestions = quiz.questions.length;
  if (totalQuestions === 0) {
    return <EmptyState fullPage title="لا توجد أسئلة" message="هذا الاختبار لا يحتوي على أسئلة بعد." />;
  }

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = quiz.questions[Math.min(currentIndex, totalQuestions - 1)];

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(totalQuestions - 1, index)));
  }

  async function handleConfirmSubmit() {
    const formatted = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }));
    setIsConfirmOpen(false);
    await submit(formatted);
  }

  // ── Graded: results overview ──
  if (result && !isReviewing) {
    const correctCount = result.answers.filter((a) => a.isCorrect).length;
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

        <section className="tiles section">
          <div className="tile">
            <span className="lead-ic">
              <span className="ms">quiz</span>
            </span>
            <span className="lbl">إجمالي الأسئلة</span>
            <span className="num">{result.total}</span>
          </div>
          <div className="tile">
            <span className="lead-ic">
              <span className="ms">check_circle</span>
            </span>
            <span className="lbl">إجابات صحيحة</span>
            <span className="num">{correctCount}</span>
          </div>
          <div className="tile">
            <span className="lead-ic">
              <span className="ms">cancel</span>
            </span>
            <span className="lbl">إجابات خاطئة</span>
            <span className="num">{result.total - correctCount}</span>
          </div>
        </section>

        <button
          type="button"
          className="btn big"
          style={{ width: '100%' }}
          onClick={() => {
            setCurrentIndex(0);
            setIsReviewing(true);
          }}
        >
          <span className="ms">fact_check</span>
          مراجعة الإجابات سؤال بسؤال
        </button>
      </>
    );
  }

  // ── Graded: review, one question per page ──
  if (result && isReviewing) {
    const questionResult = result.answers.find((a) => a.questionId === currentQuestion.id);
    const userAnswer = answers[currentQuestion.id];

    return (
      <>
        <div className="section-head">
          <div>
            <h1 className="page-title">{quiz.title}</h1>
            <p className="subtitle">مراجعة الإجابات</p>
          </div>
          <button type="button" className="btn text" onClick={() => setIsReviewing(false)}>
            <span className="ms">arrow_forward</span>
            رجوع للنتيجة
          </button>
        </div>

        <div className="detail-grid section">
          <div>
            <div className="qcard active-question" key={currentQuestion.id}>
              <p className="qnum">
                السؤال {currentIndex + 1} من {totalQuestions}
              </p>
              <p className="qtext">{currentQuestion.text}</p>

              {currentQuestion.options.map((opt) => {
                const isSelected = userAnswer === opt;
                const cls = isSelected ? (questionResult?.isCorrect ? 'correct' : 'incorrect') : '';
                return (
                  <div key={opt} className={`opt disabled ${cls}`}>
                    {isSelected && (
                      <span className="ms sm">{questionResult?.isCorrect ? 'check_circle' : 'cancel'}</span>
                    )}
                    {opt}
                  </div>
                );
              })}

              {!userAnswer && (
                <p className="meta">
                  {questionResult?.isCorrect ? 'إجابتك كانت صحيحة.' : 'إجابتك كانت خاطئة.'}
                </p>
              )}
            </div>

            <div className="quiz-nav-controls">
              <button
                type="button"
                className="btn outline"
                disabled={currentIndex === 0}
                onClick={() => goTo(currentIndex - 1)}
              >
                <span className="ms">arrow_forward</span>
                السابق
              </button>
              <button
                type="button"
                className="btn outline"
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => goTo(currentIndex + 1)}
              >
                التالي
                <span className="ms">arrow_back</span>
              </button>
            </div>
          </div>

          <aside className="quiz-nav-panel">
            <h3>الأسئلة</h3>
            <QuestionNavGrid
              questions={quiz.questions}
              currentIndex={currentIndex}
              onSelect={goTo}
              result={result}
            />
            <div className="quiz-nav-legend">
              <span className="item">
                <span className="dot correct" aria-hidden="true" /> إجابة صحيحة
              </span>
              <span className="item">
                <span className="dot incorrect" aria-hidden="true" /> إجابة خاطئة
              </span>
              <span className="item">
                <span className="dot current" aria-hidden="true" /> السؤال الحالي
              </span>
            </div>
          </aside>
        </div>
      </>
    );
  }

  // ── Taking the quiz, one question per page ──
  return (
    <>
      <h1 className="page-title" style={{ marginBottom: 4 }}>
        {quiz.title}
      </h1>
      <div className="quiz-progress-bar">
        <div className="bar" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
      </div>
      <p className="meta">
        {answeredCount} من {totalQuestions} تمت الإجابة عليها
      </p>

      <div className="detail-grid section">
        <div>
          <div className="qcard active-question" key={currentQuestion.id}>
            <p className="qnum">
              السؤال {currentIndex + 1} من {totalQuestions}
            </p>
            <p className="qtext">{currentQuestion.text}</p>
            {currentQuestion.options.map((opt) => (
              <label key={opt} className={`opt${answers[currentQuestion.id] === opt ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={opt}
                  checked={answers[currentQuestion.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt }))}
                />
                {opt}
              </label>
            ))}
          </div>

          <div className="quiz-nav-controls">
            <button
              type="button"
              className="btn outline"
              disabled={currentIndex === 0}
              onClick={() => goTo(currentIndex - 1)}
            >
              <span className="ms">arrow_forward</span>
              السابق
            </button>
            {currentIndex === totalQuestions - 1 ? (
              <button type="button" className="btn" disabled={isSubmitting} onClick={() => setIsConfirmOpen(true)}>
                <span className="ms">task_alt</span>
                إنهاء وتسليم الاختبار
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => goTo(currentIndex + 1)}>
                التالي
                <span className="ms">arrow_back</span>
              </button>
            )}
          </div>
        </div>

        <aside className="quiz-nav-panel">
          <h3>الأسئلة</h3>
          <QuestionNavGrid questions={quiz.questions} currentIndex={currentIndex} onSelect={goTo} answers={answers} />
          <div className="quiz-nav-legend">
            <span className="item">
              <span className="dot current" aria-hidden="true" /> السؤال الحالي
            </span>
            <span className="item">
              <span className="dot answered" aria-hidden="true" /> تمت الإجابة
            </span>
            <span className="item">
              <span className="dot" aria-hidden="true" /> لم تتم الإجابة
            </span>
          </div>
          <button
            type="button"
            className="btn big"
            style={{ width: '100%' }}
            disabled={isSubmitting}
            onClick={() => setIsConfirmOpen(true)}
          >
            <span className="ms">task_alt</span>
            إنهاء وتسليم الاختبار
          </button>
        </aside>
      </div>

      <ConfirmModal
        open={isConfirmOpen}
        title="تسليم الاختبار"
        message={
          answeredCount < totalQuestions
            ? `لسه في ${totalQuestions - answeredCount} سؤال من غير إجابة. متأكد إنك عايز تسلّم الاختبار كده؟`
            : 'متأكد إنك عايز تسلّم الاختبار؟ مش هينفع تعدّل إجاباتك بعد كده.'
        }
        confirmLabel="تسليم الاختبار"
        cancelLabel="متابعة الحل"
        isLoading={isSubmitting}
        onConfirm={() => void handleConfirmSubmit()}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
