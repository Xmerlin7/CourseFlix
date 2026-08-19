import type { CourseStatus } from '../../features/courses/types/course.types'
import type { EnrollmentStatus } from '../../features/student/types/student.types'
import type { DocumentProcessingStatus } from '../../features/documents/types/document.types'
import type { LessonProgressStatus } from '../../features/lessons/types/lesson.types'
import type { ExamGenerationRequestStatus } from '../../features/exam-generation/types/exam-generation.types'
import type {
  LessonAgentReviewStatus,
  LessonAgentRunStatus,
  LessonAgentStepStatus,
} from '../../features/lesson-agents/types/lesson-agents.types'
import type { NotificationType } from '../../features/notifications/types/notification.types'

/**
 * Arabic labels + M3 chip variants for every status the UI renders.
 *
 * Centralised because the raw enum values were previously printed
 * straight into the markup ("published", "active"), which left English
 * scattered through an otherwise Arabic, RTL product.
 */

type ChipVariant = '' | 'green' | 'pink' | 'red' | 'outline'

export const COURSE_STATUS: Record<CourseStatus, { label: string; chip: ChipVariant }> = {
  draft: { label: 'مسودة', chip: 'outline' },
  published: { label: 'منشورة', chip: 'green' },
  archived: { label: 'مؤرشفة', chip: '' },
}

export const ENROLLMENT_STATUS: Record<EnrollmentStatus, { label: string; chip: ChipVariant }> = {
  active: { label: 'نشط', chip: 'green' },
  suspended: { label: 'موقوف', chip: 'red' },
  completed: { label: 'مكتمل', chip: '' },
}

export const LESSON_PROGRESS_STATUS: Record<
  LessonProgressStatus,
  { label: string; chip: ChipVariant }
> = {
  not_started: { label: 'لم تبدأ بعد', chip: 'outline' },
  in_progress: { label: 'قيد المشاهدة', chip: 'pink' },
  completed: { label: 'مكتمل', chip: 'green' },
}

export const DOCUMENT_STATUS: Record<
  DocumentProcessingStatus,
  { label: string; chip: ChipVariant; icon: string }
> = {
  pending: { label: 'في الانتظار', chip: 'outline', icon: 'schedule' },
  processing: { label: 'قيد المعالجة', chip: 'pink', icon: 'autorenew' },
  completed: { label: 'تمت المعالجة', chip: 'green', icon: 'check_circle' },
  failed: { label: 'فشلت المعالجة', chip: 'red', icon: 'error' },
}

export const NOTIFICATION_TYPE: Record<
  NotificationType,
  { label: string; icon: string; lead: ChipVariant }
> = {
  hw_assigned: { label: 'واجب جديد', icon: 'assignment', lead: 'pink' },
  quiz_ready: { label: 'اختبار جاهز', icon: 'quiz', lead: '' },
  progress_report: { label: 'تقرير تقدم', icon: 'monitoring', lead: 'green' },
  announcement: { label: 'إعلان', icon: 'campaign', lead: 'pink' },
  course_update: { label: 'تحديث دورة', icon: 'menu_book', lead: '' },
  system: { label: 'إشعار عام', icon: 'info', lead: '' },
  discussion_reply: { label: 'رد في المجتمع', icon: 'forum', lead: '' },
  discussion_accepted: { label: 'إجابة مقبولة', icon: 'check_circle', lead: 'green' },
  support_ticket_update: { label: 'تحديث طلب دعم', icon: 'support_agent', lead: 'pink' },
}

export const EXAM_GENERATION_STATUS: Record<
  ExamGenerationRequestStatus,
  { label: string; chip: ChipVariant; icon: string }
> = {
  queued: { label: 'في الانتظار', chip: 'outline', icon: 'schedule' },
  processing: { label: 'الذكاء الاصطناعي يعمل...', chip: 'pink', icon: 'autorenew' },
  pending_review: { label: 'بانتظار مراجعتك', chip: 'pink', icon: 'rate_review' },
  accepted: { label: 'مقبول ومنشور', chip: 'green', icon: 'check_circle' },
  rejected: { label: 'مرفوض', chip: '', icon: 'cancel' },
  failed: { label: 'فشل الإنشاء', chip: 'red', icon: 'error' },
}

export const AGENT_RUN_STATUS: Record<
  LessonAgentRunStatus,
  { label: string; chip: ChipVariant; icon: string }
> = {
  queued: { label: 'في الطابور', chip: 'outline', icon: 'schedule' },
  running: { label: 'الفريق شغّال', chip: 'pink', icon: 'autorenew' },
  pending_review: { label: 'بانتظار مراجعتك', chip: 'pink', icon: 'rate_review' },
  completed: { label: 'اتنشر للطلاب', chip: 'green', icon: 'check_circle' },
  failed: { label: 'وقف بخطأ', chip: 'red', icon: 'error' },
}

export const AGENT_STEP_STATUS: Record<
  LessonAgentStepStatus,
  { label: string; chip: ChipVariant; icon: string }
> = {
  pending: { label: 'مستني دوره', chip: 'outline', icon: 'hourglass_empty' },
  running: { label: 'شغّال دلوقتي', chip: 'pink', icon: 'autorenew' },
  completed: { label: 'خلّص', chip: 'green', icon: 'check_circle' },
  failed: { label: 'وقف', chip: 'red', icon: 'error' },
  skipped: { label: 'متوقف من الإعدادات', chip: '', icon: 'do_not_disturb_on' },
}

// `not_required` renders nothing: the three mandatory agents are never
// reviewed, and a "لا يحتاج مراجعة" chip on each of them would be noise
// on the one screen that needs to stay scannable.
export const AGENT_REVIEW_STATUS: Record<
  Exclude<LessonAgentReviewStatus, 'not_required'>,
  { label: string; chip: ChipVariant; icon: string }
> = {
  pending: { label: 'مستني رأيك', chip: 'pink', icon: 'rate_review' },
  approved: { label: 'وافقت عليه', chip: 'green', icon: 'thumb_up' },
  rejected: { label: 'رفضته', chip: 'red', icon: 'thumb_down' },
  revision_requested: { label: 'بيتعدّل بملاحظتك', chip: 'pink', icon: 'edit_note' },
}
