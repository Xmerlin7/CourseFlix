import type { TutorCitation } from '../types/tutor.types'

interface CitationListProps {
  citations: TutorCitation[]
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null
  }

  return (
    <div className="list" style={{ marginTop: 12 }}>
      {citations.map((citation) => (
        <div
          key={`${citation.documentId}-${citation.page}-${citation.excerpt}`}
          className="list-item"
        >
          <span className="lead">
            <span className="ms">description</span>
          </span>
          <span className="body">
            <span className="t">{citation.documentName}</span>
            <span className="s">صفحة {citation.page} · {citation.excerpt}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
