import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { CourseDetail } from '../../courses/types/course.types'
import { StudentDocumentsList } from './StudentDocumentsList'

const courseId = 'course-1'

function renderSection(id = courseId) {
  return renderWithProviders(<StudentDocumentsList courseId={id} />)
}

describe('StudentDocumentsList', () => {
  it('renders the list of documents with download links', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/courses/${courseId}/documents`, () =>
        HttpResponse.json([
          {
            id: 'doc-1',
            fileName: 'ملخص الفصل الأول.pdf',
            createdAt: '2026-08-01T10:00:00.000Z',
          },
          {
            id: 'doc-2',
            fileName: 'slides.pdf',
            createdAt: '2026-08-02T10:00:00.000Z',
          },
        ]),
      ),
    )

    renderSection()

    expect(await screen.findByText('ملخص الفصل الأول.pdf')).toBeInTheDocument()
    expect(screen.getByText('slides.pdf')).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    const docLinks = links.filter((link) =>
      link.getAttribute('href')?.includes('/student/documents/'),
    )
    expect(docLinks).toHaveLength(2)
    expect(docLinks[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/student/documents/doc-1/download'),
    )
    expect(docLinks[1]).toHaveAttribute(
      'href',
      expect.stringContaining('/student/documents/doc-2/download'),
    )
    // Opens in a new tab
    expect(docLinks[0]).toHaveAttribute('target', '_blank')
  })

  it('shows an empty state when no documents exist', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/courses/${courseId}/documents`, () =>
        HttpResponse.json([]),
      ),
    )

    renderSection()

    expect(await screen.findByText('لا توجد مواد حتى الآن')).toBeInTheDocument()
  })

  it('shows an error message when the API request fails', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/courses/${courseId}/documents`, () =>
        HttpResponse.json(
          { statusCode: 500, message: 'Internal error' },
          { status: 500 },
        ),
      ),
    )

    renderSection()

    expect(await screen.findByText('تعذر تحميل ملفات الدورة')).toBeInTheDocument()
  })

  it('shows a loading state initially', () => {
    // Don't override the handler — the default returns [] eventually,
    // but we check the intermediate loading text before it resolves.
    renderSection()

    expect(screen.getByText('جارٍ تحميل الملفات...')).toBeInTheDocument()
  })
})
