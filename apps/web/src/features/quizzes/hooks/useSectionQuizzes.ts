import { useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { getSectionQuizzes } from '../api/quizzes.api';
import type { QuizSummary } from '../types/quiz.types';

export function useSectionQuizzes(sectionId: string) {
  const [data, setData] = useState<QuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSectionQuizzes(sectionId)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((e) => { if (!cancelled) setError(e as ApiError); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [sectionId]);

  const refetch = () => {
    setIsLoading(true); setError(null);
    getSectionQuizzes(sectionId)
      .then((result) => { setData(result); })
      .catch((e) => { setError(e as ApiError); })
      .finally(() => { setIsLoading(false); });
  };

  return { data, isLoading, error, refetch };
}
