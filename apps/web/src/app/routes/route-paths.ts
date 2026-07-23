/**
 * Centralized Route Paths Constants for CourseFlix.
 * Easily extendable for future sprint modules (Lessons, Quizzes, AI Tutor, Settings, Analytics, Checkout).
 */
export const ROUTE_PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',

  STUDENT: {
    ROOT: '/student',
    DASHBOARD: '/student/dashboard',
    COURSES: '/student/courses',
    COURSE_DETAIL: '/student/courses/:courseId',
  },

  TEACHER: {
    ROOT: '/teacher',
    DASHBOARD: '/teacher/dashboard',
    COURSES: '/teacher/courses',
    COURSE_DETAIL: '/teacher/courses/:courseId',
  },
} as const

export type RoutePaths = typeof ROUTE_PATHS
