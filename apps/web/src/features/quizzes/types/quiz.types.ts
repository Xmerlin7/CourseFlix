export interface QuizQuestion {
  id: string; type: 'mcq' | 'true_false'; text: string; options: string[];
}

export interface Quiz {
  id: string; title: string; questions: QuizQuestion[];
  submission: { score: number; total: number; answers: Array<{ questionId: string; isCorrect: boolean }> } | null;
}

export interface QuizSummary {
  id: string; title: string; questionCount: number;
  submission: { score: number; total: number } | null;
}

export interface SubmitAnswer {
  questionId: string; selectedAnswer: string;
}

export interface QuizResult {
  submissionId: string; score: number; total: number;
  answers: Array<{ questionId: string; isCorrect: boolean }>;
}
