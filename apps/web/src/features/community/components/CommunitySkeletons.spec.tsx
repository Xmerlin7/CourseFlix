import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnnouncementsSectionSkeleton } from './AnnouncementsSectionSkeleton'
import { CommunityPanelSkeleton } from './CommunityPanelSkeleton'
import { DiscussionDetailSkeleton } from './DiscussionDetailSkeleton'
import { DiscussionListSkeleton } from './DiscussionListSkeleton'

describe('Community skeletons', () => {
  it('DiscussionListSkeleton renders a status region', () => {
    render(<DiscussionListSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'discussion-list-skeleton')
  })

  it('AnnouncementsSectionSkeleton renders a status region', () => {
    render(<AnnouncementsSectionSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'announcements-skeleton')
  })

  it('DiscussionDetailSkeleton renders a status region', () => {
    render(<DiscussionDetailSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'discussion-detail-skeleton')
  })

  it('CommunityPanelSkeleton composes the announcements and discussion-list skeletons', () => {
    render(<CommunityPanelSkeleton />)
    expect(screen.getByTestId('announcements-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('discussion-list-skeleton')).toBeInTheDocument()
  })
})
