import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { QuizSummary } from '../../quizzes/types/quiz.types'
import type { CourseDetail } from '../types/course.types'
import { CourseDetailView } from './CourseDetailView'

const course: CourseDetail = {
  id: 'course-1',
  title: 'الميكانيكا الكلاسيكية',
  slug: 'mechanics',
  description: null,
  coverImageUrl: null,
  gradeLevel: null,
  status: 'published',
  teacher: {
    id: 'teacher-1',
    fullName: 'أ. سارة',
  },
  canEdit: false,
  sections: [
    {
      id: 'section-1',
      title: 'قوانين نيوتن',
      sortOrder: 1,
      status: 'published',
      lessons: [
        {
          id: 'lesson-1',
          title: 'القانون الأول',
          videoUrl: 'https://example.com/video.mp4',
          sortOrder: 1,
          status: 'published',
        },
      ],
    },
  ],
}

const quizzes: QuizSummary[] = [
  {
    id: 'quiz-1',
    title: 'اختبار القانون الأول',
    courseId: 'course-1',
    sectionId: 'section-1',
    lessonId: 'lesson-1',
    questionCount: 2,
    submission: null,
  },
]

describe('CourseDetailView', () => {
  it('renders a lesson quiz directly after its lesson', () => {
    renderWithProviders(<CourseDetailView course={course} courseQuizzes={quizzes} />)

    const lessonLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === '/student/lessons/lesson-1')
    const quizLink = screen.getByRole('link', { name: /اختبار القانون الأول/ })

    expect(lessonLink).toBeDefined()
    expect(quizLink).toHaveAttribute('href', '/student/quizzes/quiz-1')
    expect(lessonLink!.compareDocumentPosition(quizLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText(/اختبار بعد الدرس/)).toBeInTheDocument()
  })
})
