export type UserRole = 'student' | 'teacher';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
