export type MiniQuizStatus = 'active' | 'completed'

export interface MiniQuizQuestion {
  id: string
  type: 'mcq' | 'true_false'
  text: string
  options: string[] | null
}

export interface MiniQuiz {
  id: string
  weakConcept: string
  status: MiniQuizStatus
  score: number | null
  total: number | null
  questions: MiniQuizQuestion[]
}

export interface MiniQuizSubmitResponse {
  score: number
  total: number
  answers: Array<{ questionId: string; isCorrect: boolean }>
}
