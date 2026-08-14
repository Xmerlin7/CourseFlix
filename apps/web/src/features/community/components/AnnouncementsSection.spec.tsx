import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { AnnouncementsSection } from './AnnouncementsSection'

const sampleAnnouncements = [
  {
    id: 'ann-1',
    content: 'تنبيه: تم رفع مذكرة الفصل الأول',
    isPinned: true,
    attachments: [
      { id: 'att-1', fileName: 'chapter1.pdf', mimeType: 'application/pdf' },
      { id: 'att-2', fileName: 'diagram.png', mimeType: 'image/png' },
    ],
    canManage: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
]

describe('AnnouncementsSection', () => {
  it('renders announcements with attachments (PDF download link and image thumbnail)', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1/announcements`, () =>
        HttpResponse.json(sampleAnnouncements),
      ),
    )

    renderWithProviders(<AnnouncementsSection courseId="course-1" canManage={false} />)

    expect(await screen.findByText('تنبيه: تم رفع مذكرة الفصل الأول')).toBeInTheDocument()
    expect(screen.getByText('chapter1.pdf')).toBeInTheDocument()
    expect(screen.getByAltText('diagram.png')).toBeInTheDocument()
  })

  it('renders empty state when there are no announcements', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1/announcements`, () =>
        HttpResponse.json([]),
      ),
    )

    renderWithProviders(<AnnouncementsSection courseId="course-1" canManage={false} />)

    expect(await screen.findByText('لا توجد إعلانات بعد')).toBeInTheDocument()
  })

  it('allows teacher to open compose form when canManage is true', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1/announcements`, () =>
        HttpResponse.json([]),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<AnnouncementsSection courseId="course-1" canManage={true} />)

    const newBtn = await screen.findByRole('button', { name: /إعلان جديد/ })
    await user.click(newBtn)

    expect(screen.getByLabelText('نص الإعلان')).toBeInTheDocument()
  })
})
