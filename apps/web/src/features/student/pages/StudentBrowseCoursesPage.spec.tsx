import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentBrowseCoursesPage } from './StudentBrowseCoursesPage'

function renderPage() {
  return renderWithProviders(<StudentBrowseCoursesPage />, {
    initialEntries: ['/student/browse'],
    auth: {
      user: {
        id: 'student-1',
        email: 'student@example.com',
        fullName: 'طالب الفزياء',
        role: 'student',
        avatarUrl: null,
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    },
  })
}

describe('StudentBrowseCoursesPage', () => {
  it('shows loading skeleton while fetching course catalog', () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses`, async () => {
        return new Promise(() => {}) // never resolves
      }),
    )

    renderPage()
    expect(screen.getByTestId('browse-courses-skeleton')).toBeInTheDocument()
  })

  it('renders error state on API failure', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses`, () => {
        return HttpResponse.json({ message: 'Internal error' }, { status: 500 })
      }),
    )

    renderPage()

    expect(await screen.findByText('تعذر تحميل الدورات')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/i })).toBeInTheDocument()
  })

  it('renders empty state when catalog is empty', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses`, () => {
        return HttpResponse.json([])
      }),
    )

    renderPage()

    expect(await screen.findByText('لا توجد دورات متاحة حاليًا')).toBeInTheDocument()
    expect(screen.getByText('لسه مفيش دورات منشورة، راجع لاحقًا')).toBeInTheDocument()
  })

  it('renders courses with enrolled status, price, and actions correctly', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses`, () => {
        return HttpResponse.json([
          {
            id: 'course-1',
            title: 'الفيزياء الحديثة للثانوية العامة',
            description: 'دورة شاملة',
            coverImageUrl: null,
            gradeLevel: 'الصف الثالث الثانوي',
            teacherName: 'د. أحمد محمود',
            priceMinor: 50000,
            currency: 'EGP',
            isEnrolled: false,
          },
          {
            id: 'course-2',
            title: 'الكيمياء العضوية المتقدمة',
            description: null,
            coverImageUrl: 'https://example.com/chem.png',
            gradeLevel: 'الصف الثاني الثانوي',
            teacherName: 'أ. سارة حسن',
            priceMinor: 35000,
            currency: 'EGP',
            isEnrolled: true,
          },
        ])
      }),
    )

    renderPage()

    // Non-enrolled course assertions
    expect(await screen.findByText('الفيزياء الحديثة للثانوية العامة')).toBeInTheDocument()
    expect(screen.getByText('د. أحمد محمود')).toBeInTheDocument()
    expect(screen.getByText('الصف الثالث الثانوي')).toBeInTheDocument()
    expect(screen.getByText('٥٠٠ ج.م')).toBeInTheDocument()

    const buyBtn = screen.getByRole('link', { name: /شراء/i })
    expect(buyBtn).toHaveAttribute('href', '/student/checkout/course-1')

    // Enrolled course assertions
    expect(screen.getByText('الكيمياء العضوية المتقدمة')).toBeInTheDocument()
    expect(screen.getByText('أ. سارة حسن')).toBeInTheDocument()
    expect(screen.getByText('مشترك بالفعل')).toBeInTheDocument()

    const continueBtn = screen.getByRole('link', { name: /متابعة الدورة/i })
    expect(continueBtn).toHaveAttribute('href', '/student/courses/course-2')
  })
})
