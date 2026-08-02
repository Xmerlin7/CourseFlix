import { http, HttpResponse } from 'msw'
import { env } from '../../shared/lib/env'

const apiUrl = (path: string) => `${env.apiBaseUrl}${path}`

export const handlers = [
  http.get(apiUrl('/me'), () =>
    HttpResponse.json({
      id: 'student-1',
      email: 'student@example.com',
      fullName: 'طالب تجريبي',
      role: 'student',
      avatarUrl: null,
    }),
  ),

  http.post(apiUrl('/auth/login'), () =>
    HttpResponse.json({
      user: {
        id: 'student-1',
        email: 'student@example.com',
        fullName: 'طالب تجريبي',
        role: 'student',
        avatarUrl: null,
      },
    }),
  ),

  http.post(apiUrl('/auth/logout'), () => HttpResponse.json({ success: true })),

  http.post(apiUrl('/auth/register'), () =>
    HttpResponse.json(
      {
        user: {
          id: 'student-2',
          email: 'new@example.com',
          fullName: 'طالب جديد',
          role: 'student',
          avatarUrl: null,
        },
      },
      { status: 201 },
    ),
  ),

  http.get(apiUrl('/student/dashboard'), () =>
    HttpResponse.json({
      student: { id: 'student-1', fullName: 'طالب تجريبي' },
      stats: { enrolledCoursesCount: 1, activeCoursesCount: 1 },
      recentCourses: [
        {
          courseId: 'course-1',
          courseTitle: 'فيزياء',
          status: 'active',
          enrolledAt: '2026-07-27T08:00:00.000Z',
        },
      ],
    }),
  ),

  http.get(apiUrl('/courses/:courseId'), ({ params }) =>
    HttpResponse.json({
      id: params.courseId,
      title: 'فيزياء',
      slug: 'physics',
      description: 'دورة فيزياء تجريبية',
      coverImageUrl: null,
      gradeLevel: 'ثانوي',
      status: 'published',
      teacher: { id: 'teacher-1', fullName: 'معلم الفيزياء' },
      canEdit: false,
      sections: [],
    }),
  ),

  http.get(apiUrl('/lessons/:lessonId'), ({ params }) =>
    HttpResponse.json({
      id: params.lessonId,
      title: 'قانون نيوتن الثالث',
      video: { id: 'video-1', url: 'https://example.com/video.mp4', durationSeconds: 120 },
      progress: { lastPositionSeconds: 0, watchedPercentage: 0, status: 'not_started' },
    }),
  ),

  http.post(apiUrl('/lessons/:lessonId/progress'), () =>
    HttpResponse.json({
      watchedPercentage: 25,
      status: 'in_progress',
      attendanceAwarded: false,
    }),
  ),

  http.get(apiUrl('/quizzes/:quizId'), ({ params }) =>
    HttpResponse.json({
      id: params.quizId,
      title: 'اختبار قصير',
      questions: [
        {
          id: 'question-1',
          type: 'mcq',
          text: 'ما القانون؟',
          options: ['أ', 'ب'],
        },
      ],
    }),
  ),

  http.post(apiUrl('/quizzes/:quizId/submissions'), () =>
    HttpResponse.json({
      submissionId: 'submission-1',
      score: 1,
      total: 1,
      answers: [{ questionId: 'question-1', isCorrect: true }],
    }),
  ),

  http.get(apiUrl('/notifications'), () => HttpResponse.json([])),
  http.get(apiUrl('/notifications/unread-count'), () => HttpResponse.json({ count: 0 })),
  http.patch(apiUrl('/notifications/:notificationId/read'), ({ params }) =>
    HttpResponse.json({ id: params.notificationId, isRead: true }),
  ),

  http.post(apiUrl('/courses/:courseId/tutor/messages'), () =>
    HttpResponse.json({
      messageId: 'assistant-message-1',
      status: 'answered',
      answer: 'حسب المادة المرفوعة: لكل فعل رد فعل مساوٍ له.',
      citations: [
        {
          documentId: 'doc-1',
          documentName: 'physics.pdf',
          page: 2,
          excerpt: 'لكل فعل رد فعل مساوٍ له.',
        },
      ],
    }),
  ),
]
