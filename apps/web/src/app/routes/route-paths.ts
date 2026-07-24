export const routePaths = {
  login: '/login',
  forbidden: '/403',
  notFound: '/404',
  studentDashboard: '/student/dashboard',
  studentCourses: '/student/courses',
  studentCourseDetail: '/student/courses/:courseId',
  teacherDashboard: '/teacher/dashboard',
  teacherCourses: '/teacher/courses',
  teacherCourseDetail: '/teacher/courses/:courseId',
} as const
