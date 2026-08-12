import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SupportInboxSkeleton } from './SupportInboxSkeleton'
import { SupportTicketDetailSkeleton } from './SupportTicketDetailSkeleton'
import { SupportTicketsPageSkeleton } from './SupportTicketsPageSkeleton'

describe('Support skeletons', () => {
  it('SupportTicketsPageSkeleton renders a status region', () => {
    render(<SupportTicketsPageSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'support-tickets-skeleton')
  })

  it('SupportTicketDetailSkeleton renders a status region', () => {
    render(<SupportTicketDetailSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'support-ticket-detail-skeleton')
  })

  it('SupportInboxSkeleton renders a status region', () => {
    render(<SupportInboxSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'support-inbox-skeleton')
  })
})
