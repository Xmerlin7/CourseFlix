import type { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';

/**
 * Resolves which teacher's data a caller is acting on.
 *
 * Assistants act on behalf of the one teacher they're scoped to, so every
 * teacher-surface controller must key off that teacher's id and never the
 * assistant's own — an assistant owns no courses, so using `user.id`
 * would silently return an empty/404 view (or, worse, let scoping drift
 * apart between controllers).
 *
 * Extracted from TeacherController, which had this inline, so the other
 * teacher-surface controllers (documents, quizzes, exam-generation) can
 * share exactly one definition of the rule.
 */
export function scopeTeacherId(user: AuthenticatedUser): string {
  return user.role === 'assistant' ? user.managedByTeacherId! : user.id;
}
