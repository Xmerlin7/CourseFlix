import type { ContentStatus, CourseStatus } from '../../courses/types/course.types'

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

export interface CreateTeacherCoursePayload {
  title: string
  description?: string | null
  coverImageUrl?: string | null
  gradeLevel?: string | null
}

export interface UpdateTeacherCoursePayload {
  title?: string
  description?: string | null
  coverImageUrl?: string | null
  gradeLevel?: string | null
  status?: 'draft' | 'published'
}

export interface TeacherSection {
  id: string
  courseId: string
  title: string
  sortOrder: number
  status: ContentStatus
}

export interface CreateSectionPayload {
  title: string
}

export interface UpdateSectionPayload {
  title?: string
  status?: ContentStatus
}

export interface TeacherLesson {
  id: string
  sectionId: string
  courseId: string
  title: string
  videoUrl: string | null
  sortOrder: number
  status: ContentStatus
}

export interface CreateLessonPayload {
  title: string
  videoUrl?: string | null
}

export interface UpdateLessonPayload {
  title?: string
  videoUrl?: string | null
  status?: ContentStatus
}
