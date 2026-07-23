import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useRouteError } from 'react-router'
import { ROUTE_PATHS } from './route-paths'
import { AuthLayout } from '../layouts/AuthLayout'
import { StudentLayout } from '../layouts/StudentLayout'
import { TeacherLayout } from '../layouts/TeacherLayout'
import { LoadingState } from '../../shared/components/LoadingState'
import { ErrorState } from '../../shared/components/ErrorState'

// Lazy-loaded page components
const LoginPage = lazy(() =>
  import('../../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const StudentDashboardPage = lazy(() =>
  import('../../features/student/pages/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage }))
)
const StudentCoursesPage = lazy(() =>
  import('../../features/student/pages/StudentCoursesPage').then((m) => ({ default: m.StudentCoursesPage }))
)
const StudentCourseDetailPage = lazy(() =>
  import('../../features/student/pages/StudentCourseDetailPage').then((m) => ({ default: m.StudentCourseDetailPage }))
)
const TeacherDashboardPage = lazy(() =>
  import('../../features/teacher/pages/TeacherDashboardPage').then((m) => ({ default: m.TeacherDashboardPage }))
)
const TeacherCoursesPage = lazy(() =>
  import('../../features/teacher/pages/TeacherCoursesPage').then((m) => ({ default: m.TeacherCoursesPage }))
)
const TeacherCourseDetailPage = lazy(() =>
  import('../../features/teacher/pages/TeacherCourseDetailPage').then((m) => ({ default: m.TeacherCourseDetailPage }))
)

// Lazy-loaded status pages
const ForbiddenStatePage = lazy(() =>
  import('../../shared/components/ForbiddenState').then((m) => ({ default: m.ForbiddenState }))
)
const NotFoundStatePage = lazy(() =>
  import('../../shared/components/NotFoundState').then((m) => ({ default: m.NotFoundState }))
)

// Route-level Error Boundary component
export function RouteErrorBoundary() {
  const error = useRouteError()
  console.error('Route error caught by ErrorBoundary:', error)
  return <ErrorState />
}

// Suspense helper for lazy-loaded route elements
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>
}

/**
 * Data Router configuration for CourseFlix Sprint 1 MVP.
 * Supports nested layout routes, lazy page loading, ErrorBoundary, and centralized path constants.
 */
// eslint-disable-next-line react-refresh/only-export-components -- router config is not a component; co-locating it here keeps route wiring in one place.
export const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.ROOT,
    element: <Navigate to={ROUTE_PATHS.LOGIN} replace />,
  },

  /* Auth Routes */
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTE_PATHS.LOGIN,
        element: (
          <SuspenseWrapper>
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  /*
   * TODO: ProtectedRoute - Wrap /student and /teacher route branches with authentication check once auth provider is integrated.
   * TODO: RoleGuard - Enforce role-based access control (role === 'student' vs role === 'teacher') for student and teacher routes.
   */

  /* Student Routes */
  {
    path: ROUTE_PATHS.STUDENT.ROOT,
    element: <StudentLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTE_PATHS.STUDENT.DASHBOARD,
        element: (
          <SuspenseWrapper>
            <StudentDashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.STUDENT.COURSES,
        element: (
          <SuspenseWrapper>
            <StudentCoursesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.STUDENT.COURSE_DETAIL,
        element: (
          <SuspenseWrapper>
            <StudentCourseDetailPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  /* Teacher Routes */
  {
    path: ROUTE_PATHS.TEACHER.ROOT,
    element: <TeacherLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTE_PATHS.TEACHER.DASHBOARD,
        element: (
          <SuspenseWrapper>
            <TeacherDashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.TEACHER.COURSES,
        element: (
          <SuspenseWrapper>
            <TeacherCoursesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.TEACHER.COURSE_DETAIL,
        element: (
          <SuspenseWrapper>
            <TeacherCourseDetailPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  /* Status Pages */
  {
    path: ROUTE_PATHS.FORBIDDEN,
    element: (
      <SuspenseWrapper>
        <ForbiddenStatePage />
      </SuspenseWrapper>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ROUTE_PATHS.NOT_FOUND,
    element: (
      <SuspenseWrapper>
        <NotFoundStatePage />
      </SuspenseWrapper>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  /* Catch-all 404 Route */
  {
    path: '*',
    element: <Navigate to={ROUTE_PATHS.NOT_FOUND} replace />,
  },
])
