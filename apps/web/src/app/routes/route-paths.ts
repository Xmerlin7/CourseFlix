/**
 * Centralized Route Paths Constants for CourseFlix.
 * Easily extendable for future sprint modules (Lessons, Quizzes, AI Tutor, Settings, Analytics, Checkout).
 */
export const ROUTE_PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',

  STUDENT: {
    ROOT: '/student',
    DASHBOARD: '/student/dashboard',
    COURSES: '/student/courses',
    COURSE_DETAIL: '/student/courses/:courseId',
    ASSISTANT: '/student/courses/:courseId/assistant',
    LESSON_DETAIL: '/student/lessons/:lessonId',
    NOTIFICATIONS: '/student/notifications',
    INTERVENTIONS: '/student/interventions',
  },

  TEACHER: {
    ROOT: '/teacher',
    DASHBOARD: '/teacher/dashboard',
    COURSES: '/teacher/courses',
    COURSE_DETAIL: '/teacher/courses/:courseId',
    NOTIFICATIONS: '/teacher/notifications',
    AGENT_LOGS: '/teacher/agent-logs',
    INTERVENTIONS: '/teacher/interventions',
  },
} as const

export type RoutePaths = typeof ROUTE_PATHS
