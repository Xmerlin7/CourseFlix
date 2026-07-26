import type { CourseStatus } from '../../courses/types/course.types'

export interface TeacherDashboard {
  teacher: { id: string }
  stats: {
    ownedCourseCount: number
    publishedCourseCount: number
    enrolledStudentCount: number
  }
  recentCourses: Array<{ id: string; title: string; status: CourseStatus }>
}

export interface TeacherCourse {
  id: string
  title: string
  description: string | null
  coverImageUrl: string | null
  gradeLevel: string | null
  status: CourseStatus
}

export interface UpdateTeacherCoursePayload {
  title?: string
  description?: string | null
  coverImageUrl?: string | null
  gradeLevel?: string | null
  status?: 'draft' | 'published'
}
