import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useRouteError } from 'react-router'
import { ROUTE_PATHS } from './route-paths'
import { RequireRole } from './RequireRole'
import { AuthLayout } from '../layouts/AuthLayout'
import { StudentLayout } from '../layouts/StudentLayout'
import { TeacherLayout } from '../layouts/TeacherLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { LoadingState } from '../../shared/components/LoadingState'
import { ErrorState } from '../../shared/components/ErrorState'
import { StudentLessonSkeleton } from '../../features/lessons/components/StudentLessonSkeleton'
import { TeacherSalesSkeleton } from '../../features/sales/components/TeacherSalesSkeleton'
import { StudentHomeSkeleton } from '../../features/student/components/StudentHomeSkeleton'
import { StudentBrowseCoursesSkeleton } from '../../features/student/components/StudentBrowseCoursesSkeleton'
import { StudentCoursesSkeleton } from '../../features/student/components/StudentCoursesSkeleton'
import { StudentCourseDetailSkeleton } from '../../features/student/components/StudentCourseDetailSkeleton'
import { StudentQuizSkeleton } from '../../features/quizzes/components/StudentQuizSkeleton'
import { NotificationsSkeleton } from '../../features/notifications/components/NotificationsSkeleton'
import { StudentInterventionsSkeleton } from '../../features/interventions/components/StudentInterventionsSkeleton'
import { TeacherInterventionsSkeleton } from '../../features/interventions/components/TeacherInterventionsSkeleton'
import { StudentMiniQuizSkeleton } from '../../features/interventions/components/StudentMiniQuizSkeleton'
import { TeacherDashboardSkeleton } from '../../features/teacher/components/TeacherDashboardSkeleton'
import { TeacherCoursesSkeleton } from '../../features/teacher/components/TeacherCoursesSkeleton'
import { TeacherStudentsSkeleton } from '../../features/teacher/components/TeacherStudentsSkeleton'
import { TeacherCourseDetailSkeleton } from '../../features/teacher/components/TeacherCourseDetailSkeleton'
import { AgentLogsSkeleton } from '../../features/agent-logs/components/AgentLogsSkeleton'
import { SettingsSkeleton } from '../../features/settings/components/SettingsSkeleton'
import { StudentProfileSkeleton } from '../../features/profile/components/StudentProfileSkeleton'
import { LoginSkeleton } from '../../features/auth/components/LoginSkeleton'
import { RegisterSkeleton } from '../../features/auth/components/RegisterSkeleton'
import { DiscussionDetailSkeleton } from '../../features/community/components/DiscussionDetailSkeleton'
import { StudentCommunitySkeleton } from '../../features/community/components/StudentCommunitySkeleton'
import { SupportTicketsPageSkeleton } from '../../features/support/components/SupportTicketsPageSkeleton'
import { SupportTicketDetailSkeleton } from '../../features/support/components/SupportTicketDetailSkeleton'
import { SupportInboxSkeleton } from '../../features/support/components/SupportInboxSkeleton'

// Lazy-loaded page components
const LoginPage = lazy(() =>
  import('../../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = lazy(() =>
  import('../../features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
)
const TermsPage = lazy(() =>
  import('../../features/auth/pages/TermsPage').then((m) => ({ default: m.TermsPage }))
)
const PrivacyPage = lazy(() =>
  import('../../features/auth/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
)
const StudentDashboardPage = lazy(() =>
  import('../../features/student/pages/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage }))
)
const StudentBrowseCoursesPage = lazy(() =>
  import('../../features/student/pages/StudentBrowseCoursesPage').then((m) => ({ default: m.StudentBrowseCoursesPage }))
)
const StudentCoursesPage = lazy(() =>
  import('../../features/student/pages/StudentCoursesPage').then((m) => ({ default: m.StudentCoursesPage }))
)
const StudentCourseDetailPage = lazy(() =>
  import('../../features/student/pages/StudentCourseDetailPage').then((m) => ({ default: m.StudentCourseDetailPage }))
)
const StudentLessonPage = lazy(() =>
  import('../../features/lessons/pages/StudentLessonPage').then((m) => ({ default: m.StudentLessonPage }))
)
const StudentQuizPage = lazy(() =>
  import('../../features/quizzes/pages/StudentQuizPage').then((m) => ({ default: m.StudentQuizPage }))
)
const StudentAssistantPage = lazy(() =>
  import('../../features/tutor/pages/StudentAssistantPage').then((m) => ({ default: m.StudentAssistantPage }))
)
const TeacherDashboardPage = lazy(() =>
  import('../../features/teacher/pages/TeacherDashboardPage').then((m) => ({ default: m.TeacherDashboardPage }))
)
const TeacherCoursesPage = lazy(() =>
  import('../../features/teacher/pages/TeacherCoursesPage').then((m) => ({ default: m.TeacherCoursesPage }))
)
const TeacherStudentsPage = lazy(() =>
  import('../../features/teacher/pages/TeacherStudentsPage').then((m) => ({ default: m.TeacherStudentsPage }))
)
const TeacherCourseCreatePage = lazy(() =>
  import('../../features/teacher/pages/TeacherCourseCreatePage').then((m) => ({ default: m.TeacherCourseCreatePage }))
)
const TeacherCourseDetailPage = lazy(() =>
  import('../../features/teacher/pages/TeacherCourseDetailPage').then((m) => ({ default: m.TeacherCourseDetailPage }))
)
const NotificationsPage = lazy(() =>
  import('../../features/notifications/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
)
const SettingsPage = lazy(() =>
  import('../../features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const AssistantActionsPage = lazy(() =>
  import('../../features/assistant-actions/pages/AssistantActionsPage').then((m) => ({
    default: m.AssistantActionsPage,
  }))
)
const StudentProfilePage = lazy(() =>
  import('../../features/profile/pages/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage }))
)
const DiscussionDetailPage = lazy(() =>
  import('../../features/community/pages/DiscussionDetailPage').then((m) => ({ default: m.DiscussionDetailPage }))
)
const StudentCommunityPage = lazy(() =>
  import('../../features/community/pages/StudentCommunityPage').then((m) => ({ default: m.StudentCommunityPage }))
)
const StudentCourseCommunityPage = lazy(() =>
  import('../../features/community/pages/StudentCourseCommunityPage').then((m) => ({ default: m.StudentCourseCommunityPage }))
)
const AnnouncementRedirectPage = lazy(() =>
  import('../../features/community/pages/AnnouncementRedirectPage').then((m) => ({ default: m.AnnouncementRedirectPage }))
)
const TeacherCommunityPage = lazy(() =>
  import('../../features/community/pages/TeacherCommunityPage').then((m) => ({ default: m.TeacherCommunityPage }))
)
const TeacherCourseCommunityPage = lazy(() =>
  import('../../features/community/pages/TeacherCourseCommunityPage').then((m) => ({ default: m.TeacherCourseCommunityPage }))
)
const SupportTicketsPage = lazy(() =>
  import('../../features/support/pages/SupportTicketsPage').then((m) => ({ default: m.SupportTicketsPage }))
)
const SupportTicketDetailPage = lazy(() =>
  import('../../features/support/pages/SupportTicketDetailPage').then((m) => ({ default: m.SupportTicketDetailPage }))
)
const SupportInboxPage = lazy(() =>
  import('../../features/support/pages/SupportInboxPage').then((m) => ({ default: m.SupportInboxPage }))
)
const AgentLogsPage = lazy(() =>
  import('../../features/agent-logs/pages/AgentLogsPage').then((m) => ({ default: m.AgentLogsPage }))
)
const StudentInterventionsPage = lazy(() =>
  import('../../features/interventions/pages/StudentInterventionsPage').then((m) => ({
    default: m.StudentInterventionsPage,
  }))
)
const TeacherInterventionsPage = lazy(() =>
  import('../../features/interventions/pages/TeacherInterventionsPage').then((m) => ({
    default: m.TeacherInterventionsPage,
  }))
)
const StudentMiniQuizPage = lazy(() =>
  import('../../features/interventions/pages/StudentMiniQuizPage').then((m) => ({
    default: m.StudentMiniQuizPage,
  }))
)
const TeacherSalesPage = lazy(() =>
  import('../../features/sales/pages/TeacherSalesPage').then((m) => ({
    default: m.TeacherSalesPage,
  }))
)
const TeacherAnalyticsPage = lazy(() =>
  import('../../features/analytics/pages/TeacherAnalyticsPage').then((m) => ({
    default: m.TeacherAnalyticsPage,
  }))
)
const CheckoutPage = lazy(() =>
  import('../../features/checkout/pages/CheckoutPage').then((m) => ({
    default: m.CheckoutPage,
  }))
)
const AdminDashboardPage = lazy(() =>
  import('../../features/admin/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  }))
)
const AdminUsersPage = lazy(() =>
  import('../../features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
)
const AdminUserDetailPage = lazy(() =>
  import('../../features/admin/pages/AdminUserDetailPage').then((m) => ({
    default: m.AdminUserDetailPage,
  }))
)
const AdminCreateAdminPage = lazy(() =>
  import('../../features/admin/pages/AdminCreateAdminPage').then((m) => ({
    default: m.AdminCreateAdminPage,
  }))
)
const AdminCreateTeacherPage = lazy(() =>
  import('../../features/admin/pages/AdminCreateTeacherPage').then((m) => ({
    default: m.AdminCreateTeacherPage,
  }))
)
const AdminCreateAssistantPage = lazy(() =>
  import('../../features/admin/pages/AdminCreateAssistantPage').then((m) => ({
    default: m.AdminCreateAssistantPage,
  }))
)
const AdminCoursesPage = lazy(() =>
  import('../../features/admin/pages/AdminCoursesPage').then((m) => ({ default: m.AdminCoursesPage }))
)
const AdminCourseDetailPage = lazy(() =>
  import('../../features/admin/pages/AdminCourseDetailPage').then((m) => ({
    default: m.AdminCourseDetailPage,
  }))
)
const AdminOrdersPage = lazy(() =>
  import('../../features/admin/pages/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage }))
)
const AdminOrderDetailPage = lazy(() =>
  import('../../features/admin/pages/AdminOrderDetailPage').then((m) => ({
    default: m.AdminOrderDetailPage,
  }))
)
const AdminQuizzesPage = lazy(() =>
  import('../../features/admin/pages/AdminQuizzesPage').then((m) => ({ default: m.AdminQuizzesPage }))
)
const AdminQuizDetailPage = lazy(() =>
  import('../../features/admin/pages/AdminQuizDetailPage').then((m) => ({
    default: m.AdminQuizDetailPage,
  }))
)
const AdminDocumentsPage = lazy(() =>
  import('../../features/admin/pages/AdminDocumentsPage').then((m) => ({
    default: m.AdminDocumentsPage,
  }))
)
const AdminInterventionsPage = lazy(() =>
  import('../../features/admin/pages/AdminInterventionsPage').then((m) => ({
    default: m.AdminInterventionsPage,
  }))
)
const AdminNotificationsLogPage = lazy(() =>
  import('../../features/admin/pages/AdminNotificationsLogPage').then((m) => ({
    default: m.AdminNotificationsLogPage,
  }))
)
const AdminAgentLogsPage = lazy(() =>
  import('../../features/admin/pages/AdminAgentLogsPage').then((m) => ({
    default: m.AdminAgentLogsPage,
  }))
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
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <ErrorState />
    </div>
  )
}

// Suspense helper for lazy-loaded route elements
function SuspenseWrapper({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <Suspense fallback={fallback ?? <LoadingState />}>{children}</Suspense>
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
          <SuspenseWrapper fallback={<LoginSkeleton />}>
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.REGISTER,
        element: (
          <SuspenseWrapper fallback={<RegisterSkeleton />}>
            <RegisterPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  /* Public legal pages — own standalone shell (not AuthLayout's split
     form screen), reachable while logged out (linked from the register
     wizard) or logged in. */
  {
    path: ROUTE_PATHS.TERMS,
    errorElement: <RouteErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <TermsPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTE_PATHS.PRIVACY,
    errorElement: <RouteErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <PrivacyPage />
      </SuspenseWrapper>
    ),
  },

  /* Student Routes — gated behind RequireRole("student"): unauthenticated
     users are sent to /login, wrong-role users to /403. */
  {
    element: <RequireRole role="student" />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTE_PATHS.STUDENT.ROOT,
        element: <StudentLayout />,
        children: [
          {
            // Bare /student is a real destination — the sidebar logo and any
            // hand-typed URL land here. Without an index route it matched
            // the layout with no child and rendered an empty page. Admin
            // already had this; student and teacher did not.
            index: true,
            element: <Navigate to={ROUTE_PATHS.STUDENT.DASHBOARD} replace />,
          },
          {
            path: ROUTE_PATHS.STUDENT.DASHBOARD,
            element: (
              <SuspenseWrapper fallback={<StudentHomeSkeleton />}>
                <StudentDashboardPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.BROWSE,
            element: (
              <SuspenseWrapper fallback={<StudentBrowseCoursesSkeleton />}>
                <StudentBrowseCoursesPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.COURSES,
            element: (
              <SuspenseWrapper fallback={<StudentCoursesSkeleton />}>
                <StudentCoursesPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.COURSE_DETAIL,
            element: (
              <SuspenseWrapper fallback={<StudentCourseDetailSkeleton />}>
                <StudentCourseDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.LESSON_DETAIL,
            element: (
              <SuspenseWrapper fallback={<StudentLessonSkeleton />}>
                <StudentLessonPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.QUIZ_DETAIL,
            element: (
              <SuspenseWrapper fallback={<StudentQuizSkeleton />}>
                <StudentQuizPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.ASSISTANT,
            element: (
              <SuspenseWrapper>
                <StudentAssistantPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.NOTIFICATIONS,
            element: (
              <SuspenseWrapper fallback={<NotificationsSkeleton />}>
                <NotificationsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.INTERVENTIONS,
            element: (
              <SuspenseWrapper fallback={<StudentInterventionsSkeleton />}>
                <StudentInterventionsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.MINI_QUIZ,
            element: (
              <SuspenseWrapper fallback={<StudentMiniQuizSkeleton />}>
                <StudentMiniQuizPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.CHECKOUT,
            element: (
              <SuspenseWrapper>
                <CheckoutPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.SETTINGS,
            element: (
              <SuspenseWrapper fallback={<SettingsSkeleton />}>
                <SettingsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.PROFILE,
            element: (
              <SuspenseWrapper fallback={<StudentProfileSkeleton />}>
                <StudentProfilePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.DISCUSSION_DETAIL,
            element: (
              <SuspenseWrapper fallback={<DiscussionDetailSkeleton />}>
                <DiscussionDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.SUPPORT,
            element: (
              <SuspenseWrapper fallback={<SupportTicketsPageSkeleton />}>
                <SupportTicketsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.SUPPORT_DETAIL,
            element: (
              <SuspenseWrapper fallback={<SupportTicketDetailSkeleton />}>
                <SupportTicketDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.COMMUNITY,
            element: (
              <SuspenseWrapper fallback={<StudentCommunitySkeleton />}>
                <StudentCommunityPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.COMMUNITY_COURSE,
            element: (
              <SuspenseWrapper fallback={<StudentCommunitySkeleton />}>
                <StudentCourseCommunityPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.STUDENT.ANNOUNCEMENT_DETAIL,
            element: (
              <SuspenseWrapper fallback={<LoadingState variant="list" count={2} />}>
                <AnnouncementRedirectPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },

  /* Teacher Routes — gated behind RequireRole(["teacher", "assistant"]).
     Assistants share the teacher's course/student surface; anything
     payment- or analytics-adjacent (sales, analytics, agent logs,
     intervention reports) is nested under its own RequireRole("teacher")
     below, mirroring the API's TeacherRoleGuard-only controllers. */
  {
    element: <RequireRole role={['teacher', 'assistant']} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTE_PATHS.TEACHER.ROOT,
        element: <TeacherLayout />,
        children: [
          {
            // Bare /teacher is a real destination — the sidebar logo and any
            // hand-typed URL land here. Without an index route it matched
            // the layout with no child and rendered an empty page. Admin
            // already had this; student and teacher did not.
            index: true,
            element: <Navigate to={ROUTE_PATHS.TEACHER.DASHBOARD} replace />,
          },
          {
            path: ROUTE_PATHS.TEACHER.DASHBOARD,
            element: (
              <SuspenseWrapper fallback={<TeacherDashboardSkeleton />}>
                <TeacherDashboardPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.COURSES,
            element: (
              <SuspenseWrapper fallback={<TeacherCoursesSkeleton />}>
                <TeacherCoursesPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.STUDENTS,
            element: (
              <SuspenseWrapper fallback={<TeacherStudentsSkeleton />}>
                <TeacherStudentsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.COURSE_CREATE,
            element: (
              <SuspenseWrapper>
                <TeacherCourseCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.COURSE_DETAIL,
            element: (
              <SuspenseWrapper fallback={<TeacherCourseDetailSkeleton />}>
                <TeacherCourseDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.LESSON_DETAIL,
            element: (
              <SuspenseWrapper fallback={<StudentLessonSkeleton />}>
                <StudentLessonPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.NOTIFICATIONS,
            element: (
              <SuspenseWrapper fallback={<NotificationsSkeleton />}>
                <NotificationsPage />
              </SuspenseWrapper>
            ),
          },
          {
            // Not teacher-only — assistants manage their own account too.
            path: ROUTE_PATHS.TEACHER.SETTINGS,
            element: (
              <SuspenseWrapper fallback={<SettingsSkeleton />}>
                <SettingsPage />
              </SuspenseWrapper>
            ),
          },
          {
            // Teacher reviews here; assistant sees the same page filtered
            // to their own submissions (scoped server-side).
            path: ROUTE_PATHS.TEACHER.ASSISTANT_ACTIONS,
            element: (
              <SuspenseWrapper>
                <AssistantActionsPage />
              </SuspenseWrapper>
            ),
          },
          {
            // Same page component for every role — it reads `user.role`
            // for the badge and shortcut list. See StudentProfilePage.
            path: ROUTE_PATHS.TEACHER.PROFILE,
            element: (
              <SuspenseWrapper fallback={<StudentProfileSkeleton />}>
                <StudentProfilePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.COMMUNITY,
            element: (
              <SuspenseWrapper fallback={<StudentCommunitySkeleton />}>
                <TeacherCommunityPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.COMMUNITY_COURSE,
            element: (
              <SuspenseWrapper fallback={<StudentCommunitySkeleton />}>
                <TeacherCourseCommunityPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.ANNOUNCEMENT_DETAIL,
            element: (
              <SuspenseWrapper fallback={<LoadingState variant="list" count={2} />}>
                <AnnouncementRedirectPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.DISCUSSION_DETAIL,
            element: (
              <SuspenseWrapper fallback={<DiscussionDetailSkeleton />}>
                <DiscussionDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            // Support staff is served by teacher/assistant/admin, not a new
            // role — see SupportStaffRoleGuard on the API. Shared with
            // assistants on purpose, so the teacher isn't the only one who
            // can triage tickets.
            path: ROUTE_PATHS.TEACHER.SUPPORT,
            element: (
              <SuspenseWrapper fallback={<SupportInboxSkeleton />}>
                <SupportInboxPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.TEACHER.SUPPORT_DETAIL,
            element: (
              <SuspenseWrapper fallback={<SupportTicketDetailSkeleton />}>
                <SupportTicketDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            // Teacher-only: assistants get redirected to /403 here, same
            // as hitting the equivalent API route.
            element: <RequireRole role="teacher" />,
            children: [
              {
                path: ROUTE_PATHS.TEACHER.AGENT_LOGS,
                element: (
                  <SuspenseWrapper fallback={<AgentLogsSkeleton />}>
                    <AgentLogsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: ROUTE_PATHS.TEACHER.INTERVENTIONS,
                element: (
                  <SuspenseWrapper fallback={<TeacherInterventionsSkeleton />}>
                    <TeacherInterventionsPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: ROUTE_PATHS.TEACHER.SALES,
                element: (
                  <SuspenseWrapper fallback={<TeacherSalesSkeleton />}>
                    <TeacherSalesPage />
                  </SuspenseWrapper>
                ),
              },
              {
                path: ROUTE_PATHS.TEACHER.ANALYTICS,
                element: (
                  <SuspenseWrapper>
                    <TeacherAnalyticsPage />
                  </SuspenseWrapper>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  /* Admin Routes — gated behind RequireRole("admin"). */
  {
    element: <RequireRole role="admin" />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTE_PATHS.ADMIN.ROOT,
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTE_PATHS.ADMIN.DASHBOARD} replace />,
          },
          {
            path: ROUTE_PATHS.ADMIN.DASHBOARD,
            element: (
              <SuspenseWrapper>
                <AdminDashboardPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.USERS,
            element: (
              <SuspenseWrapper>
                <AdminUsersPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.CREATE_ADMIN,
            element: (
              <SuspenseWrapper>
                <AdminCreateAdminPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.CREATE_TEACHER,
            element: (
              <SuspenseWrapper>
                <AdminCreateTeacherPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.CREATE_ASSISTANT,
            element: (
              <SuspenseWrapper>
                <AdminCreateAssistantPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.USER_DETAIL,
            element: (
              <SuspenseWrapper>
                <AdminUserDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.COURSES,
            element: (
              <SuspenseWrapper>
                <AdminCoursesPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.COURSE_DETAIL,
            element: (
              <SuspenseWrapper>
                <AdminCourseDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.ORDERS,
            element: (
              <SuspenseWrapper>
                <AdminOrdersPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.ORDER_DETAIL,
            element: (
              <SuspenseWrapper>
                <AdminOrderDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.QUIZZES,
            element: (
              <SuspenseWrapper>
                <AdminQuizzesPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.QUIZ_DETAIL,
            element: (
              <SuspenseWrapper>
                <AdminQuizDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.DOCUMENTS,
            element: (
              <SuspenseWrapper>
                <AdminDocumentsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.INTERVENTIONS,
            element: (
              <SuspenseWrapper>
                <AdminInterventionsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.NOTIFICATIONS,
            element: (
              <SuspenseWrapper fallback={<NotificationsSkeleton />}>
                <NotificationsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.NOTIFICATIONS_LOG,
            element: (
              <SuspenseWrapper>
                <AdminNotificationsLogPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.AGENT_LOGS,
            element: (
              <SuspenseWrapper>
                <AdminAgentLogsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.SETTINGS,
            element: (
              <SuspenseWrapper fallback={<SettingsSkeleton />}>
                <SettingsPage />
              </SuspenseWrapper>
            ),
          },
          {
            // Same page component for every role — it reads `user.role`
            // for the badge and shortcut list. See StudentProfilePage.
            path: ROUTE_PATHS.ADMIN.PROFILE,
            element: (
              <SuspenseWrapper fallback={<StudentProfileSkeleton />}>
                <StudentProfilePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.SUPPORT,
            element: (
              <SuspenseWrapper fallback={<SupportInboxSkeleton />}>
                <SupportInboxPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ROUTE_PATHS.ADMIN.SUPPORT_DETAIL,
            element: (
              <SuspenseWrapper fallback={<SupportTicketDetailSkeleton />}>
                <SupportTicketDetailPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },

  /* Status Pages — full-viewport wrapper: these render with no
     sidebar/topbar shell, so the state component (which only centers
     itself within its own box, for when it's reused inline on a normal
     page) needs an outer box the size of the actual screen to center
     within. */
  {
    path: ROUTE_PATHS.FORBIDDEN,
    element: (
      <div className="flex min-h-screen w-full items-center justify-center">
        <SuspenseWrapper>
          <ForbiddenStatePage />
        </SuspenseWrapper>
      </div>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ROUTE_PATHS.NOT_FOUND,
    element: (
      <div className="flex min-h-screen w-full items-center justify-center">
        <SuspenseWrapper>
          <NotFoundStatePage />
        </SuspenseWrapper>
      </div>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  /* Catch-all 404 Route */
  {
    path: '*',
    element: <Navigate to={ROUTE_PATHS.NOT_FOUND} replace />,
  },
])
