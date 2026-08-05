export type ContentStatus = 'draft' | 'published'

export interface CourseLesson {
  id: string
  title: string
  videoUrl: string | null
  sortOrder: number
  status: ContentStatus
}

export interface CourseSection {
  id: string
  title: string
  sortOrder: number
  status: ContentStatus
  lessons: CourseLesson[]
}

export type CourseStatus = 'draft' | 'published' | 'archived'

export interface CourseDetail {
  id: string
  title: string
  slug: string
  description: string | null
  coverImageUrl: string | null
  gradeLevel: string | null
  status: CourseStatus
  teacher: {
    id: string
    fullName: string
  }
  canEdit: boolean
  sections: CourseSection[]
}
