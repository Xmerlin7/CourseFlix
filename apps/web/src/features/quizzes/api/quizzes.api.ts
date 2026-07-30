import { httpClient } from '../../../shared/api/http-client';
import type { Quiz, QuizResult, QuizSummary, SubmitAnswer } from '../types/quiz.types';

export async function getQuiz(quizId: string): Promise<Quiz> {
  return httpClient.get<Quiz>(`/quizzes/${quizId}`);
}

export async function submitQuiz(quizId: string, answers: SubmitAnswer[]): Promise<QuizResult> {
  return httpClient.post<QuizResult>(`/quizzes/${quizId}/submissions`, { answers });
}

export async function getLessonQuizzes(lessonId: string): Promise<QuizSummary[]> {
  return httpClient.get<QuizSummary[]>(`/lessons/${lessonId}/quizzes`);
}

export async function getSectionQuizzes(sectionId: string): Promise<QuizSummary[]> {
  return httpClient.get<QuizSummary[]>(`/sections/${sectionId}/quizzes`);
}
