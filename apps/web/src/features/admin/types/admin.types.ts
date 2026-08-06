import type { UserRole } from '../../auth/types/auth.types'
import type { CourseStatus } from '../../courses/types/course.types'

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

export interface AdminCourseListItem {
  id: string
  title: string
  slug: string
  gradeLevel: string | null
  status: CourseStatus
  teacherId: string
  teacherName: string
  createdAt: string
}

export interface AdminCoursesFilter {
  status?: CourseStatus
  teacherId?: string
  search?: string
}

export interface UpdateAdminCoursePayload {
  title?: string
  description?: string | null
  coverImageUrl?: string | null
  gradeLevel?: string | null
  status?: 'draft' | 'published'
}

export type OrderStatus = 'pending' | 'paid' | 'failed'

export interface AdminOrderListItem {
  id: string
  studentId: string
  studentName: string
  status: OrderStatus
  paymentStatus: OrderStatus
  currency: string
  totalMinor: number
  createdAt: string
  paidAt: string | null
}

export interface AdminOrderDetail extends AdminOrderListItem {
  items: Array<{ courseId: string; title: string; priceMinor: number }>
  payments: Array<{
    id: string
    attemptNo: number
    status: OrderStatus
    method: string
    externalRef: string | null
    createdAt: string
  }>
}

export interface AdminOrdersFilter {
  status?: OrderStatus
  studentId?: string
}
