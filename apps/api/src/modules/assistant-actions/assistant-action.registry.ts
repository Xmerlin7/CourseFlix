import { TeacherService } from '../teacher/teacher.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { ExamGenerationService } from '../exam-generation/exam-generation.service';
import { DocumentsService } from '../documents/documents.service';

/** Services a replay may call, injected once by AssistantActionsService. */
export interface ReplayDeps {
  teacherService: TeacherService;
  quizzesService: QuizzesService;
  examGenerationService: ExamGenerationService;
  documentsService: DocumentsService;
}

export interface ReplayContext {
  params: Record<string, string>;
  body: Record<string, unknown>;
  /** The teacher the action is executed as — never the assistant. */
  teacherId: string;
}

interface ActionDefinition {
  /** Arabic verb phrase for the review queue, e.g. "إنشاء دورة". */
  label: string;
  /**
   * Builds the one-line summary shown to the teacher. Runs at park time,
   * with only the request to work from — it must not hit the database,
   * since parking happens on the request path.
   */
  describe: (context: Omit<ReplayContext, 'teacherId'>) => string;
  /** Performs the action for real, once the teacher approves. */
  run: (deps: ReplayDeps, context: ReplayContext) => Promise<unknown>;
}

/** Reads a string field off a parked body without trusting its shape. */
function text(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function quoted(value: string | null, fallback: string): string {
  return value ? `«${value}»` : fallback;
}

/**
 * Every assistant-writable route, keyed by `${METHOD} ${route pattern}`.
 *
 * This is an explicit allow-list, not a generic re-dispatch: replaying a
 * parked request by re-entering the HTTP layer would mean re-running
 * guards as a user who isn't logged in, and forging a teacher session to
 * do it. Calling the same service method the controller calls keeps the
 * replay on one code path, keeps it typed, and makes it testable without
 * a server.
 *
 * A route reachable by assistants but missing here is refused outright by
 * PendingApprovalInterceptor rather than silently executed — see the
 * comment there. That's the safe direction: a new endpoint is unavailable
 * to assistants until someone adds it, instead of bypassing review.
 */
export const ASSISTANT_ACTIONS: Record<string, ActionDefinition> = {
  // ── Courses ──
  'POST /api/v1/teacher/courses': {
    label: 'إنشاء دورة',
    describe: ({ body }) => `إنشاء دورة ${quoted(text(body, 'title'), 'جديدة')}`,
    run: (d, { body, teacherId }) =>
      d.teacherService.createCourse(teacherId, body as never),
  },
  'PATCH /api/v1/teacher/courses/:courseId': {
    label: 'تعديل دورة',
    describe: ({ body }) =>
      `تعديل بيانات دورة ${quoted(text(body, 'title'), '')}`.trim(),
    run: (d, { params, body, teacherId }) =>
      d.teacherService.updateCourse(params.courseId, teacherId, body as never),
  },
  'DELETE /api/v1/teacher/courses/:courseId': {
    label: 'حذف دورة',
    describe: () => 'حذف دورة',
    run: (d, { params, teacherId }) =>
      d.teacherService.deleteCourse(params.courseId, teacherId),
  },

  // ── Sections ──
  'POST /api/v1/teacher/courses/:courseId/sections': {
    label: 'إضافة قسم',
    describe: ({ body }) => `إضافة قسم ${quoted(text(body, 'title'), 'جديد')}`,
    run: (d, { params, body, teacherId }) =>
      d.teacherService.createSection(params.courseId, teacherId, body as never),
  },
  'PATCH /api/v1/teacher/sections/:sectionId': {
    label: 'تعديل قسم',
    describe: ({ body }) =>
      `تعديل قسم ${quoted(text(body, 'title'), '')}`.trim(),
    run: (d, { params, body, teacherId }) =>
      d.teacherService.updateSection(
        params.sectionId,
        teacherId,
        body as never,
      ),
  },
  'DELETE /api/v1/teacher/sections/:sectionId': {
    label: 'حذف قسم',
    describe: () => 'حذف قسم من الدورة',
    run: (d, { params, teacherId }) =>
      d.teacherService.deleteSection(params.sectionId, teacherId),
  },
  'PATCH /api/v1/teacher/courses/:courseId/sections/reorder': {
    label: 'إعادة ترتيب الأقسام',
    describe: () => 'إعادة ترتيب أقسام الدورة',
    run: (d, { params, body, teacherId }) =>
      d.teacherService.reorderSections(
        params.courseId,
        teacherId,
        body as never,
      ),
  },

  // ── Lessons ──
  'POST /api/v1/teacher/sections/:sectionId/lessons': {
    label: 'إضافة درس',
    describe: ({ body }) => `إضافة درس ${quoted(text(body, 'title'), 'جديد')}`,
    run: (d, { params, body, teacherId }) =>
      d.teacherService.createLesson(params.sectionId, teacherId, body as never),
  },
  'PATCH /api/v1/teacher/lessons/:lessonId': {
    label: 'تعديل درس',
    describe: ({ body }) =>
      `تعديل درس ${quoted(text(body, 'title'), '')}`.trim(),
    run: (d, { params, body, teacherId }) =>
      d.teacherService.updateLesson(params.lessonId, teacherId, body as never),
  },
  'DELETE /api/v1/teacher/lessons/:lessonId': {
    label: 'حذف درس',
    describe: () => 'حذف درس من الدورة',
    run: (d, { params, teacherId }) =>
      d.teacherService.deleteLesson(params.lessonId, teacherId),
  },
  'PATCH /api/v1/teacher/sections/:sectionId/lessons/reorder': {
    label: 'إعادة ترتيب الدروس',
    describe: () => 'إعادة ترتيب دروس القسم',
    run: (d, { params, body, teacherId }) =>
      d.teacherService.reorderLessons(
        params.sectionId,
        teacherId,
        body as never,
      ),
  },

  // ── Enrollment ──
  'PATCH /api/v1/teacher/students/:studentId/courses/:courseId/enrollment-status':
    {
      label: 'تغيير حالة اشتراك طالب',
      describe: ({ body }) =>
        text(body, 'status') === 'suspended'
          ? 'إيقاف اشتراك طالب في دورة'
          : 'إعادة تفعيل اشتراك طالب في دورة',
      run: (d, { params, body, teacherId }) =>
        d.teacherService.setStudentEnrollmentStatus(
          teacherId,
          params.studentId,
          params.courseId,
          body.status as never,
          body.reason as string | undefined,
        ),
    },

  // ── Quizzes ──
  'POST /api/v1/teacher/quizzes': {
    label: 'إنشاء اختبار',
    describe: ({ body }) =>
      `إنشاء اختبار ${quoted(text(body, 'title'), 'جديد')}`,
    run: (d, { body, teacherId }) =>
      d.quizzesService.createQuiz(teacherId, body as never),
  },
  'PATCH /api/v1/teacher/quizzes/:quizId': {
    label: 'تعديل اختبار',
    describe: ({ body }) =>
      `تعديل اختبار ${quoted(text(body, 'title'), '')}`.trim(),
    run: (d, { params, body, teacherId }) =>
      d.quizzesService.updateQuiz(params.quizId, teacherId, body as never),
  },
  'DELETE /api/v1/teacher/quizzes/:quizId': {
    label: 'حذف اختبار',
    describe: () => 'حذف اختبار',
    run: (d, { params, teacherId }) =>
      d.quizzesService.deleteQuiz(params.quizId, teacherId),
  },

  // ── AI exam generation ──
  'POST /api/v1/teacher/exam-generation-requests': {
    label: 'طلب توليد اختبار بالذكاء الاصطناعي',
    describe: () => 'طلب توليد اختبار جديد بالذكاء الاصطناعي',
    run: (d, { body, teacherId }) =>
      d.examGenerationService.createRequest(teacherId, body as never),
  },
  'POST /api/v1/teacher/exam-generation-requests/:requestId/accept': {
    label: 'قبول اختبار مولَّد',
    describe: () => 'قبول ونشر اختبار مولَّد بالذكاء الاصطناعي',
    run: (d, { params, teacherId }) =>
      d.examGenerationService.accept(params.requestId, teacherId),
  },
  'POST /api/v1/teacher/exam-generation-requests/:requestId/reject': {
    label: 'رفض اختبار مولَّد',
    describe: () => 'رفض اختبار مولَّد بالذكاء الاصطناعي',
    run: (d, { params, teacherId }) =>
      d.examGenerationService.reject(params.requestId, teacherId),
  },
  'POST /api/v1/teacher/exam-generation-requests/:requestId/feedback': {
    label: 'إرسال ملاحظات على اختبار مولَّد',
    describe: () => 'إرسال ملاحظات لإعادة توليد اختبار',
    run: (d, { params, body, teacherId }) =>
      d.examGenerationService.submitFeedback(
        params.requestId,
        teacherId,
        body.message as string,
      ),
  },

  // ── Documents ──
  'POST /api/v1/teacher/documents/:documentId/retry': {
    label: 'إعادة معالجة مستند',
    describe: () => 'إعادة محاولة معالجة مستند فشل رفعه',
    run: (d, { params, teacherId }) =>
      d.documentsService.retryDocument(params.documentId, teacherId),
  },
};

export function findActionDefinition(
  routeKey: string,
): ActionDefinition | undefined {
  return ASSISTANT_ACTIONS[routeKey];
}
