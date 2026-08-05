export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface LessonVideo {
  id: string
  url: string
  durationSeconds: number | null
}

export interface LessonProgress {
  lastPositionSeconds: number
  watchedPercentage: number
  status: LessonProgressStatus
}

export interface LessonCourseOutlineLesson {
  id: string
  title: string
  sortOrder: number
  progressStatus?: LessonProgressStatus
  watchedPercentage?: number
}

export interface LessonCourseOutlineSection {
  id: string
  title: string
  sortOrder: number
  lessons: LessonCourseOutlineLesson[]
}

export interface LessonCourseOutline {
  id: string
  title: string
  currentSectionId: string
  sections: LessonCourseOutlineSection[]
}

export interface LessonDetail {
  id: string
  title: string
  video: LessonVideo
  course: LessonCourseOutline
  progress: LessonProgress
}

export interface UpdateProgressRequest {
  positionSeconds: number
  watchedSeconds: number
  durationSeconds?: number
}

export interface UpdateProgressResponse {
  watchedPercentage: number
  status: LessonProgressStatus
  attendanceAwarded: boolean
}
