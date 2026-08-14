import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import type { UserRole } from '../../auth/types/auth.types'
import type { NotificationItem } from '../types/notification.types'

/**
 * Resolves the page a notification should deep-link to. The API sets
 * `relatedEntityType`/`relatedEntityId` on most notifications so a click can
 * take the user straight to the entity (course, quiz, thread, ticket, …).
 * The route depends on the signed-in role: teachers and assistants share the
 * `/teacher` surface, admins have their own, and quizzes/interventions only
 * exist for students.
 *
 * Returns `null` for system notifications or when no route matches the role,
 * in which case the row stays non-clickable.
 */
export interface NotificationTarget {
  path: string
  actionLabel: string
  actionIcon: string
}

const ROLE_PREFIX: Record<UserRole, string> = {
  student: '/student',
  teacher: '/teacher',
  assistant: '/teacher',
  admin: '/admin',
}

/** Replaces the route template's `:param` segment with the real entity id. */
function withId(template: string, id: string): string {
  return template.replace(/\/:[^/]+/g, `/${id}`)
}

export function resolveNotificationTarget(
  notification: Pick<NotificationItem, 'relatedEntityType' | 'relatedEntityId'>,
  role: UserRole,
): NotificationTarget | null {
  const { relatedEntityType, relatedEntityId } = notification
  if (!relatedEntityType || !relatedEntityId) return null

  const prefix = ROLE_PREFIX[role]
  const isStudent = role === 'student'
  const isAdmin = role === 'admin'

  switch (relatedEntityType) {
    case 'discussion_thread':
      return isAdmin
        ? null
        : {
            path: withId(
              isStudent
                ? ROUTE_PATHS.STUDENT.DISCUSSION_DETAIL
                : ROUTE_PATHS.TEACHER.DISCUSSION_DETAIL,
              relatedEntityId,
            ),
            actionLabel: 'افتح النقاش',
            actionIcon: 'forum',
          }

    case 'support_ticket':
      return {
        path: withId(
          isStudent
            ? ROUTE_PATHS.STUDENT.SUPPORT_DETAIL
            : prefix === '/admin'
              ? ROUTE_PATHS.ADMIN.SUPPORT_DETAIL
              : ROUTE_PATHS.TEACHER.SUPPORT_DETAIL,
          relatedEntityId,
        ),
        actionLabel: 'افتح التذكرة',
        actionIcon: 'support_agent',
      }

    case 'mini_quiz':
      return isStudent
        ? {
            path: withId(ROUTE_PATHS.STUDENT.MINI_QUIZ, relatedEntityId),
            actionLabel: 'ابدأ الكويز',
            actionIcon: 'quiz',
          }
        : null

    case 'quiz':
      return isStudent
        ? {
            path: withId(ROUTE_PATHS.STUDENT.QUIZ_DETAIL, relatedEntityId),
            actionLabel: 'ابدأ الاختبار',
            actionIcon: 'quiz',
          }
        : null

    case 'course':
      return {
        path: withId(
          isStudent
            ? ROUTE_PATHS.STUDENT.COURSE_DETAIL
            : prefix === '/admin'
              ? ROUTE_PATHS.ADMIN.COURSE_DETAIL
              : ROUTE_PATHS.TEACHER.COURSE_DETAIL,
          relatedEntityId,
        ),
        actionLabel: 'افتح الدورة',
        actionIcon: 'menu_book',
      }

    case 'intervention':
      return {
        path: isStudent
          ? ROUTE_PATHS.STUDENT.INTERVENTIONS
          : ROUTE_PATHS.TEACHER.INTERVENTIONS,
        actionLabel: 'شوف التقرير',
        actionIcon: 'monitoring',
      }

    case 'assistant_action':
      return prefix === '/teacher'
        ? {
            path: ROUTE_PATHS.TEACHER.ASSISTANT_ACTIONS,
            actionLabel: 'راجع الطلب',
            actionIcon: 'fact_check',
          }
        : null

    case 'post':
      return isAdmin
        ? null
        : {
            path: withId(
              isStudent
                ? ROUTE_PATHS.STUDENT.ANNOUNCEMENT_DETAIL
                : ROUTE_PATHS.TEACHER.ANNOUNCEMENT_DETAIL,
              relatedEntityId,
            ),
            actionLabel: 'افتح الإعلان',
            actionIcon: 'campaign',
          }

    default:
      return null
  }
}
