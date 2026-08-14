import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { CommunityCourseRow } from './CommunityCourseRow'
import { DiscussionReplyRow } from './DiscussionReplyRow'
import { DiscussionReplyComposer } from './DiscussionReplyComposer'
import type { DiscussionReply } from '../types/community.types'

describe('CommunityCourseRow', () => {
  it('renders read course row with title, grade, and timestamp without unread badge', () => {
    render(
      <MemoryRouter>
        <CommunityCourseRow
          courseId="course-1"
          title="الفيزياء الحديثة"
          gradeLevel="الصف الثالث الثانوي"
          to="/student/community/course-1"
          summary={{
            courseId: 'course-1',
            preview: 'أحمد: ما هو قانون كولوم؟',
            lastActivityAt: new Date().toISOString(),
            unreadCount: 0,
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('الفيزياء الحديثة')).toBeInTheDocument()
    expect(screen.getByText('الصف الثالث الثانوي')).toBeInTheDocument()
    expect(screen.getByText('أحمد: ما هو قانون كولوم؟')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders unread course row with unread highlight and numeric badge', () => {
    const { container } = render(
      <MemoryRouter>
        <CommunityCourseRow
          courseId="course-2"
          title="الكيمياء العضوية"
          gradeLevel="الصف الثاني الثانوي"
          to="/teacher/community/course-2"
          summary={{
            courseId: 'course-2',
            preview: 'سؤال جديد ينتظر الرد',
            lastActivityAt: new Date().toISOString(),
            unreadCount: 5,
          }}
        />
      </MemoryRouter>,
    )

    const link = container.querySelector('.community-row')
    expect(link).toHaveClass('unread')
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('الكيمياء العضوية')).toBeInTheDocument()
  })

  it('renders unavailable row when isUnavailable=true', () => {
    render(
      <MemoryRouter>
        <CommunityCourseRow
          courseId="course-3"
          title="دورة محذوفة"
          to="/student/community/course-3"
          isUnavailable
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('الدورة غير متاحة')).toBeInTheDocument()
    expect(screen.getByText('لا يمكنك الوصول إلى مجتمع هذه الدورة حاليًا')).toBeInTheDocument()
  })
})

describe('DiscussionReplyRow', () => {
  const baseReply: DiscussionReply = {
    id: 'reply-1',
    body: 'هذا هو الحل النموذجي للمسألة.',
    isAccepted: false,
    createdAt: new Date().toISOString(),
    author: {
      id: 'teacher-1',
      fullName: 'أستاذ محمد',
      avatarUrl: null,
      role: 'teacher',
    },
  }

  it('renders author details, role chip, and message body', () => {
    render(<DiscussionReplyRow reply={baseReply} />)

    expect(screen.getByText('أستاذ محمد')).toBeInTheDocument()
    expect(screen.getByText('المدرس')).toBeInTheDocument()
    expect(screen.getByText('هذا هو الحل النموذجي للمسألة.')).toBeInTheDocument()
  })

  it('renders assistant role chip for assistant replies', () => {
    render(
      <DiscussionReplyRow
        reply={{
          ...baseReply,
          author: { ...baseReply.author, role: 'assistant' },
        }}
      />,
    )

    expect(screen.getByText('مساعد المدرس')).toBeInTheDocument()
  })

  it('renders accepted badge when isAccepted is true', () => {
    render(<DiscussionReplyRow reply={{ ...baseReply, isAccepted: true }} />)

    expect(screen.getByText('إجابة مقبولة')).toBeInTheDocument()
  })

  it('calls onAccept when accept button is clicked', async () => {
    const handleAccept = vi.fn()
    render(<DiscussionReplyRow reply={baseReply} canAccept onAccept={handleAccept} />)

    const acceptBtn = screen.getByRole('button', { name: 'اعتماد كإجابة' })
    await userEvent.click(acceptBtn)

    expect(handleAccept).toHaveBeenCalledWith('reply-1')
  })
})

describe('DiscussionReplyComposer', () => {
  it('submits on Enter keypress without Shift', async () => {
    const handleSubmit = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiscussionReplyComposer
        value="إجابة السؤال بالتفصيل"
        onChange={handleChange}
        onSubmit={handleSubmit}
      />,
    )

    const textarea = screen.getByPlaceholderText(/اضغط Enter للإرسال/i)
    await userEvent.type(textarea, '{Enter}')

    expect(handleSubmit).toHaveBeenCalled()
  })
})
