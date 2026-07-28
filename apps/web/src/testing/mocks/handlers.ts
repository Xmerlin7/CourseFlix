import { http, HttpResponse } from 'msw'

const student = {
  id: 'student-1',
  email: 'student@courseflix.local',
  role: 'student',
  fullName: 'عبدالله حبسه',
  avatarUrl: null,
}

const teacher = {
  id: 'teacher-1',
  email: 'teacher@courseflix.local',
  role: 'teacher',
  fullName: 'محمد عبدالرحمن',
  avatarUrl: null,
}

const course = {
  id: 'course-1',
  title: 'الميكانيكا الكلاسيكية',
  slug: 'classical-mechanics',
  description: 'مقدمة في قوانين نيوتن للحركة والتطبيقات العملية عليها.',
  coverImageUrl: null,
  gradeLevel: 'الصف الأول الثانوي',
  status: 'published',
  teacher: { id: teacher.id, fullName: teacher.fullName },
  canEdit: false,
  sections: [
    {
      id: 'section-1',
      title: 'قوانين نيوتن للحركة',
      sortOrder: 1,
      lessons: [
        {
          id: 'lesson-1',
          title: 'القانون الأول لنيوتن: القصور الذاتي',
          videoUrl: null,
          sortOrder: 1,
        },
      ],
    },
  ],
}

export const handlers = [
  http.get('*/api/v1/me', () => HttpResponse.json(student)),

  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string }
    return HttpResponse.json({
      user: body.email === teacher.email ? teacher : student,
    })
  }),

  http.post('*/api/v1/auth/logout', () => HttpResponse.json({ success: true })),

  http.post('*/api/v1/auth/register', () =>
    HttpResponse.json(
      {
        user: student,
      },
      { status: 201 },
    ),
  ),

  http.get('*/api/v1/student/dashboard', () =>
    HttpResponse.json({
      student: { id: student.id, fullName: student.fullName, email: student.email, avatarUrl: null },
      stats: { enrolledCoursesCount: 1, activeCoursesCount: 1 },
      overallProgressPercent: null,
      continueLearning: null,
      recentCourses: [
        {
          courseId: course.id,
          courseTitle: course.title,
          coverImageUrl: null,
          status: 'active',
          enrolledAt: '2026-07-01T12:00:00.000Z',
        },
      ],
    }),
  ),

  http.get('*/api/v1/student/enrollments', () =>
    HttpResponse.json([
      {
        id: 'enrollment-1',
        courseId: course.id,
        courseTitle: course.title,
        gradeLevel: course.gradeLevel,
        status: 'active',
      },
    ]),
  ),

  http.get('*/api/v1/courses/:courseId', () => HttpResponse.json(course)),

  http.get('*/api/v1/teacher/dashboard', () =>
    HttpResponse.json({
      teacher: { id: teacher.id },
      stats: { ownedCourseCount: 1, publishedCourseCount: 1, enrolledStudentCount: 1 },
      recentCourses: [{ id: course.id, title: course.title, status: 'published' }],
    }),
  ),

  http.get('*/api/v1/teacher/courses', () =>
    HttpResponse.json([
      {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImageUrl: null,
        gradeLevel: course.gradeLevel,
        status: 'published',
      },
    ]),
  ),

  http.patch('*/api/v1/teacher/courses/:courseId', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...course, ...body })
  }),

  http.get('*/api/v1/lessons/:lessonId', () =>
    HttpResponse.json({
      id: 'lesson-1',
      title: 'القانون الأول لنيوتن: القصور الذاتي',
      video: { id: 'video-1', url: 'https://example.com/video.mp4', durationSeconds: 600 },
      progress: { lastPositionSeconds: 0, watchedPercentage: 0, status: 'not_started' },
    }),
  ),

  http.post('*/api/v1/lessons/:lessonId/progress', () =>
    HttpResponse.json({ watchedPercentage: 25, status: 'in_progress', attendanceAwarded: false }),
  ),

  http.get('*/api/v1/quizzes/:quizId', () =>
    HttpResponse.json({
      id: 'quiz-1',
      title: 'اختبار قوانين نيوتن',
      questions: [
        {
          id: 'question-1',
          type: 'multiple_choice',
          text: 'ما القانون الذي يصف القصور الذاتي؟',
          options: [
            { id: 'option-1', text: 'القانون الأول' },
            { id: 'option-2', text: 'القانون الثاني' },
          ],
        },
      ],
    }),
  ),

  http.post('*/api/v1/quizzes/:quizId/submissions', () =>
    HttpResponse.json({
      submissionId: 'submission-1',
      score: 1,
      total: 1,
      answers: [{ questionId: 'question-1', isCorrect: true }],
    }),
  ),

  http.post('*/api/v1/teacher/courses/:courseId/documents', () =>
    HttpResponse.json({ id: 'document-1', fileName: 'newton.pdf', processingStatus: 'pending', version: 1 }),
  ),

  http.get('*/api/v1/teacher/courses/:courseId/documents', () =>
    HttpResponse.json([
      {
        id: 'document-1',
        fileName: 'newton.pdf',
        processingStatus: 'completed',
        version: 1,
        createdAt: '2026-07-28T12:00:00.000Z',
        errorMessage: null,
      },
    ]),
  ),

  http.post('*/api/v1/teacher/documents/:documentId/retry', () =>
    HttpResponse.json({ id: 'document-1', processingStatus: 'pending' }),
  ),

  http.get('*/api/v1/notifications', () =>
    HttpResponse.json([
      {
        id: 'notification-1',
        type: 'document_processed',
        title: 'اكتملت معالجة الملف',
        message: 'أصبح الملف جاهزًا للبحث.',
        isRead: false,
        createdAt: '2026-07-28T12:00:00.000Z',
      },
    ]),
  ),

  http.get('*/api/v1/notifications/unread-count', () => HttpResponse.json({ count: 1 })),

  http.patch('*/api/v1/notifications/:notificationId/read', () =>
    HttpResponse.json({ id: 'notification-1', isRead: true }),
  ),

  http.post('*/api/v1/courses/:courseId/tutor/messages', () =>
    HttpResponse.json({
      messageId: 'message-1',
      status: 'answered',
      answer: 'ينص القانون الأول لنيوتن على أن الجسم يبقى على حالته ما لم تؤثر عليه قوة محصلة.',
      citations: [
        {
          documentId: 'document-1',
          documentName: 'newton.pdf',
          page: 3,
          excerpt: 'القانون الأول لنيوتن يصف القصور الذاتي.',
        },
      ],
    }),
  ),
]
