import { useCallback } from 'react'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import type { StudentCommunitySummaryItem } from '../../student/types/student.types'
import { CommunityCourseRow } from './CommunityCourseRow'

export interface CommunityCourseItem {
  id: string
  title: string
  to: string
  coverImageUrl?: string | null
  gradeLevel?: string | null
  summary?: StudentCommunitySummaryItem
  isUnavailable?: boolean
}

export interface CommunityCourseListProps {
  courses: CommunityCourseItem[]
  searchId?: string
  searchLabel?: string
  searchPlaceholder?: string
  noResultsMessage?: string
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 10

export function CommunityCourseList({
  courses,
  searchId = 'community-search',
  searchLabel = 'بحث عن دورة',
  searchPlaceholder = 'ابحث باسم الدورة...',
  noResultsMessage = 'مفيش دورات مطابقة لبحثك.',
  pageSize = DEFAULT_PAGE_SIZE,
}: CommunityCourseListProps) {
  const toHaystack = useCallback((course: CommunityCourseItem) => course.title, [])
  const list = usePaginatedList(courses, toHaystack, pageSize)

  return (
    <>
      <SearchField
        id={searchId}
        label={searchLabel}
        placeholder={searchPlaceholder}
        value={list.query}
        onChange={list.search}
      />

      {list.pageItems.length === 0 ? (
        <p className="community-no-results">{noResultsMessage}</p>
      ) : (
        <div className="community-list">
          {list.pageItems.map((course) => (
            <CommunityCourseRow
              key={course.id}
              courseId={course.id}
              title={course.title}
              to={course.to}
              coverImageUrl={course.coverImageUrl}
              gradeLevel={course.gradeLevel}
              summary={course.summary}
              isUnavailable={course.isUnavailable}
            />
          ))}
        </div>
      )}

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={pageSize}
          itemLabel="دورة"
        />
      )}
    </>
  )
}
