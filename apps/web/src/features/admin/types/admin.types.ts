import type { UserRole } from '../../auth/types/auth.types'

export type UserStatus = 'active' | 'suspended' | 'inactive'

export interface AdminUserListItem {
  id: string
  fullName: string
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminUserDetail extends AdminUserListItem {
  avatarUrl: string | null
  updatedAt: string
  dependentRecordCounts: {
    coursesTaught: number
    enrollments: number
    orders: number
  }
}

export interface AdminUsersFilter {
  role?: UserRole
  status?: UserStatus
  search?: string
}

export interface UpdateAdminUserPayload {
  fullName?: string
  avatarUrl?: string | null
}

export interface CreateAdminAccountPayload {
  fullName: string
  email: string
  password: string
}
