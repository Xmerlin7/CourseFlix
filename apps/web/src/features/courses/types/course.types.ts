export type ContentStatus = 'draft' | 'published'

export type VideoModerationStatus = 'pending' | 'approved' | 'rejected'

export interface CourseLesson {
  id: string
  title: string
  videoUrl: string | null
  sortOrder: number
  status: ContentStatus
  /**
   * Review state of the lesson's video; null when there's no video yet.
   * Separate from `status`, which is only the publish/draft toggle — a
   * published lesson with a pending or rejected video is still hidden
   * from students. Only populated for viewers who can edit the course.
   */
  videoModerationStatus?: VideoModerationStatus | null
  /** Teacher/admin only. */
  videoModerationReason?: string | null
}

export interface CourseSection {
  id: string
  title: string
  sortOrder: number
  status: ContentStatus
  lessons: CourseLesson[]
}

export type CourseStatus = 'draft' | 'published' | 'archived'

export interface CourseCatalogItem {
  id: string
  title: string
  description: string | null
  coverImageUrl: string | null
  gradeLevel: string | null
  teacherName: string
  priceMinor: number
  currency: string
  isEnrolled: boolean
}

export interface CourseDetail {
  id: string
  title: string
  slug: string
  description: string | null
  coverImageUrl: string | null
  gradeLevel: string | null
  status: CourseStatus
  /** null = platform default price. In EGP minor units (1/100 EGP). */
  priceMinor: number | null
  teacher: {
    id: string
    fullName: string
  }
  canEdit: boolean
  sections: CourseSection[]
}
