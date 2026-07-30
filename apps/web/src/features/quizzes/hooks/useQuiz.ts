import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { getQuiz, submitQuiz } from '../api/quizzes.api';
import type { Quiz, QuizResult, SubmitAnswer } from '../types/quiz.types';

export function useQuiz(quizId: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getQuiz(quizId)
      .then((data) => {
        if (cancelled) return;
        setQuiz(data);
        if (data.submission) setResult({
          submissionId: '', score: data.submission.score,
          total: data.submission.total, answers: data.submission.answers,
        });
      })
      .catch((e) => { if (!cancelled) setError(e as ApiError); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [quizId]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getQuiz(quizId)
      .then((data) => { setQuiz(data); if (data.submission) setResult({ submissionId: '', score: data.submission.score, total: data.submission.total, answers: data.submission.answers }); })
      .catch((e) => { setError(e as ApiError); })
      .finally(() => { setIsLoading(false); });
  }, [quizId]);

  const submit = useCallback(async (answers: SubmitAnswer[]) => {
    setIsSubmitting(true);
    try {
      const res = await submitQuiz(quizId, answers);
      setResult(res);
      return res;
    } finally { setIsSubmitting(false); }
  }, [quizId]);

  return { quiz, isLoading, error, refetch, submit, result, isSubmitting };
}
