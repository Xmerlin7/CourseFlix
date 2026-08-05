import { httpClient } from '../../../shared/api/http-client';
import type {
  CreateTeacherQuizPayload,
  Quiz,
  QuizResult,
  QuizSummary,
  SubmitAnswer,
  TeacherQuiz,
  UpdateTeacherQuizPayload,
} from '../types/quiz.types';

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

export async function getCourseQuizzes(courseId: string): Promise<QuizSummary[]> {
  return httpClient.get<QuizSummary[]>(`/courses/${courseId}/quizzes`);
}

export async function getTeacherCourseQuizzes(courseId: string): Promise<TeacherQuiz[]> {
  return httpClient.get<TeacherQuiz[]>(`/teacher/courses/${courseId}/quizzes`);
}

export async function createTeacherQuiz(payload: CreateTeacherQuizPayload): Promise<TeacherQuiz> {
  return httpClient.post<TeacherQuiz>('/teacher/quizzes', payload);
}

export async function updateTeacherQuiz(
  quizId: string,
  payload: UpdateTeacherQuizPayload,
): Promise<TeacherQuiz> {
  return httpClient.patch<TeacherQuiz>(`/teacher/quizzes/${quizId}`, payload);
}

export async function deleteTeacherQuiz(quizId: string): Promise<void> {
  await httpClient.delete(`/teacher/quizzes/${quizId}`);
}
