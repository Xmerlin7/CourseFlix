import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Pagination } from '../../../shared/components/Pagination'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ErrorState } from '../../../shared/components/ErrorState'
import { showToast } from '../../../shared/components/Toast'
import { useAuth } from '../../auth/hooks/useAuth'
import { createDiscussion } from '../api/community.api'
import { useDiscussions } from '../hooks/useDiscussions'
import type { DiscussionStatusFilter } from '../types/community.types'
import { AskQuestionDialog } from './AskQuestionDialog'
import { DiscussionCard } from './DiscussionCard'
import { DiscussionListSkeleton } from './DiscussionListSkeleton'

interface DiscussionsSectionProps {
  courseId: string
}

const STATUS_FILTERS: { value: DiscussionStatusFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'unanswered', label: 'بدون إجابة' },
  { value: 'answered', label: 'تمت الإجابة' },
  { value: 'mine', label: 'أسئلتي' },
]

const PAGE_SIZE = 10

/** The endpoint already filters — don't filter twice. */
const NO_CLIENT_FILTER = () => ''

export function DiscussionsSection({ courseId }: DiscussionsSectionProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isStudent = user?.role === 'student'
  const detailPathPrefix = isStudent ? '/student/discussions' : '/teacher/discussions'

  const [status, setStatus] = useState<DiscussionStatusFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, isLoading, error, refetch } = useDiscussions(courseId, { status, search })

  // The search box above posts its term to the endpoint, so the hook only
  // paginates; `search` is passed so a new term returns to page 1.
  const list = usePaginatedList(data, NO_CLIENT_FILTER, PAGE_SIZE, search)

  async function handleAsk(input: { title?: string; body: string; tags: string[]; attachment: File | null }) {
    setIsSubmitting(true)
    try {
      const thread = await createDiscussion(courseId, input)
      showToast('تم نشر سؤالك بنجاح', 'success')
      navigate(`${detailPathPrefix}/${thread.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
  }

  function clearSearch() {
    setSearchInput('')
    setSearch('')
  }

  return (
    <section className="section" aria-label="مناقشات الدورة">
      <div className="support-page-head" style={{ marginBottom: 16 }}>
        <div className="support-page-title-group">
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>المجتمع</h2>
          <p className="support-page-subtitle" style={{ margin: 0 }}>
            اتناقش مع زملائك والمدرس في كل ما يخص الكورس
          </p>
        </div>
        {isStudent && (
          <button type="button" className="btn primary" onClick={() => setIsAsking(true)}>
            <span className="ms" aria-hidden="true">add_circle</span>
            اسأل سؤال
          </button>
        )}
      </div>

      <div className="support-controls-section" style={{ marginBottom: 20 }}>
        {/* Shares SearchField's classes rather than the component itself:
            this box submits on Enter (the endpoint does the searching, so
            firing per keystroke would be a request per character), and
            SearchField is a controlled live-filter input. Same markup, so
            it looks identical to every other search box in the app. */}
        <form onSubmit={handleSearchSubmit} className="tf search-field" style={{ margin: 0 }}>
          <label htmlFor="discussions-search">بحث في المناقشات</label>
          <div className="search-field-box">
            <span className="ms search-field-icon" aria-hidden="true">search</span>
            <input
              id="discussions-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="اكتب كلمة واضغط Enter للبحث..."
            />
            {searchInput && (
              <button
                type="button"
                className="search-field-clear"
                onClick={clearSearch}
                aria-label="مسح البحث"
              >
                <span className="ms">close</span>
              </button>
            )}
          </div>
        </form>

        <div className="support-status-filters" role="tablist" aria-label="تصفية المناقشات">
          {STATUS_FILTERS.map((filter) => {
            const isActive = status === filter.value
            return (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatus(filter.value)}
                className={`support-filter-chip${isActive ? ' active' : ''}`}
              >
                <span>{filter.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <DiscussionListSkeleton />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : data.length === 0 ? (
        search ? (
          <EmptyState
            variant="search"
            title="لم نجد أي مناقشات مطابقة لبحثك"
            actionLabel="مسح البحث"
            onAction={clearSearch}
          />
        ) : (
          <EmptyState
            title="لا يوجد أسئلة بعد"
            message="كن أول من يسأل في هذه الدورة"
            actionLabel={isStudent ? 'اسأل أول سؤال' : undefined}
            onAction={isStudent ? () => setIsAsking(true) : undefined}
          />
        )
      ) : (
        <>
          <div className="support-tickets-list">
            {list.pageItems.map((thread) => (
              <DiscussionCard key={thread.id} thread={thread} to={`${detailPathPrefix}/${thread.id}`} />
            ))}
          </div>

          {list.hasPages && (
            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              onPageChange={list.setPage}
              matchCount={list.matchCount}
              pageSize={PAGE_SIZE}
              itemLabel="مناقشة"
            />
          )}
        </>
      )}

      <AskQuestionDialog
        open={isAsking}
        isSubmitting={isSubmitting}
        onSubmit={handleAsk}
        onClose={() => setIsAsking(false)}
      />
    </section>
  )
}

