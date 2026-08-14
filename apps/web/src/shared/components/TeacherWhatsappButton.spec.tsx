import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../lib/env'
import { server } from '../../testing/mocks/server'
import { TeacherWhatsappButton } from './TeacherWhatsappButton'

describe('TeacherWhatsappButton', () => {
  it('stays hidden when the teacher has no WhatsApp number', async () => {
    render(<TeacherWhatsappButton />)

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /واتساب/ })).not.toBeInTheDocument()
    })
  })

  it('links students to the configured teacher WhatsApp number', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/teacher-contact`, () =>
        HttpResponse.json({
          teacherName: 'محمد عبدالرحمن',
          whatsappNumber: '201001112233',
          whatsappHref: 'https://wa.me/201001112233?text=hello',
        }),
      ),
    )

    render(<TeacherWhatsappButton />)

    const link = await screen.findByRole('link', { name: /محمد عبدالرحمن/ })
    expect(link).toHaveAttribute('href', 'https://wa.me/201001112233?text=hello')
  })
})
