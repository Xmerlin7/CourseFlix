export type UserRole = 'student' | 'teacher'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}
