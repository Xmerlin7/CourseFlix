import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
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

  async function handleAsk(input: { title: string; body: string; tags: string[]; attachment: File | null }) {
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
      <div className="section-head" style={{ flexWrap: 'wrap', gap: 10 }}>
        <h2>المناقشات</h2>
        {isStudent && (
          <button type="button" className="btn primary" onClick={() => setIsAsking(true)}>
            <span className="ms">add_circle</span>
            اسأل سؤال
          </button>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex" style={{ gap: 8, marginBottom: 14 }}>
        <div className="tf" style={{ flex: 1, marginBottom: 0 }}>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ابحث في المناقشات..."
            aria-label="ابحث في المناقشات"
          />
        </div>
        <button type="submit" className="btn outline">
          <span className="ms">search</span>
        </button>
      </form>

      <div className="tabs" role="tablist" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={status === filter.value}
            onClick={() => setStatus(filter.value)}
            className={`tab${status === filter.value ? ' active' : ''}`}
          >
            {filter.label}
          </button>
        ))}
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
        <div className="list">
          {data.map((thread) => (
            <DiscussionCard key={thread.id} thread={thread} to={`${detailPathPrefix}/${thread.id}`} />
          ))}
        </div>
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
