import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { CourseDetail } from '../../courses/types/course.types'
import { TeacherContentManager } from './TeacherContentManager'

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
  canEdit: true,
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
          videoUrl: 'https://example.com/old.mp4',
          sortOrder: 1,
          status: 'published',
        },
      ],
    },
  ],
}

describe('TeacherContentManager', () => {
  it('lets teachers edit an existing lesson title and video URL', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    let payload: unknown

    server.use(
      http.patch(`${env.apiBaseUrl}/teacher/lessons/lesson-1`, async ({ request }) => {
        payload = await request.json()
        return HttpResponse.json({
          ...course.sections[0].lessons[0],
          ...(payload as object),
        })
      }),
    )

    renderWithProviders(<TeacherContentManager course={course} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /تعديل/ }))
    const titleField = screen.getByDisplayValue('القانون الأول')
    const videoUrlField = screen.getByDisplayValue('https://example.com/old.mp4')

    await user.clear(titleField)
    await user.type(titleField, 'القانون الأول المعدل')
    await user.clear(videoUrlField)
    await user.type(videoUrlField, 'https://example.com/new.mp4')
    await user.click(screen.getByRole('button', { name: /حفظ/ }))

    expect(payload).toEqual({
      title: 'القانون الأول المعدل',
      videoUrl: 'https://example.com/new.mp4',
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('lets teachers paste a Bunny Stream embed code when adding a lesson', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    let payload: unknown
    const embedCode =
      '<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/663132/b40c3ee1-00ee-4fd8-ab8e-2e0993b11030?autoplay=true&loop=false&muted=true&preload=true&responsive=true" loading="lazy"></iframe></div>'

    server.use(
      http.post(`${env.apiBaseUrl}/teacher/sections/section-1/lessons`, async ({ request }) => {
        payload = await request.json()
        return HttpResponse.json({
          id: 'lesson-2',
          title: 'Bunny lesson',
          videoUrl: embedCode,
          sortOrder: 2,
          status: 'published',
        })
      }),
    )

    renderWithProviders(<TeacherContentManager course={course} onChange={onChange} />)

    await user.type(screen.getByPlaceholderText('اسم الدرس'), 'Bunny lesson')
    fireEvent.change(
      screen.getByPlaceholderText('رابط الفيديو أو كود embed من Bunny.net (اختياري)'),
      { target: { value: embedCode } },
    )
    await user.click(screen.getByRole('button', { name: /إضافة درس/ }))

    expect(payload).toEqual({
      title: 'Bunny lesson',
      videoUrl: embedCode,
      // The default mode is the plain upload, so the API is told to run
      // its own caption ingestion rather than wait for an agent crew.
      useAgents: false,
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('opens custom confirmation modal when deleting a section', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm')

    renderWithProviders(<TeacherContentManager course={course} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'حذف قسم قوانين نيوتن' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'حذف القسم' })).toBeInTheDocument()
    expect(
      screen.getByText('حذف القسم سيؤدي إلى حذف كل الدروس الموجودة بداخله. هل أنت متأكد؟'),
    ).toBeInTheDocument()

    confirmSpy.mockRestore()
  })
})
