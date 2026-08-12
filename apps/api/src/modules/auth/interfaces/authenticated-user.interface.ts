export type UserRole = 'student' | 'teacher' | 'admin' | 'assistant';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string | null;
  // Only set for role: 'assistant' — the teacher they're scoped to.
  managedByTeacherId: string | null;
}
