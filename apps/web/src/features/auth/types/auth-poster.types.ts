export interface AuthPosterCourse {
  id: string | null
  title: string
  description: string | null
  coverImageUrl: string | null
  gradeLevel: string | null
  teacherName: string
}

export interface AuthPosterCustomization {
  badgeText: string
  teacherPrefix: string
  studyPlanValue: string
  studyPlanLabel: string
  quizValue: string
  quizLabel: string
  followUpValue: string
  followUpLabel: string
  journeyLabel: string
}

export const DEFAULT_AUTH_POSTER_CUSTOMIZATION: AuthPosterCustomization = {
  badgeText: 'منصة تعليم تفاعلية',
  teacherPrefix: 'مع الأستاذ',
  studyPlanValue: '١٢ أسبوع',
  studyPlanLabel: 'خطة مذاكرة',
  quizValue: '٤٨ تدريب',
  quizLabel: 'اختبارات قصيرة',
  followUpValue: 'كل حصة',
  followUpLabel: 'متابعة تقدم',
  journeyLabel: 'رحلة الطالب',
}

export interface AuthPosterContent {
  featuredCourseId: string | null
  course: AuthPosterCourse
  isFallback: boolean
  customization?: AuthPosterCustomization
}

export interface UpdateAuthPosterPayload {
  featuredCourseId?: string | null
  customization?: AuthPosterCustomization
}
