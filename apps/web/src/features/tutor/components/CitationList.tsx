import type { TutorCitation } from '../types/tutor.types'

interface CitationListProps {
  citations: TutorCitation[]
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null
  }

  return (
    <div className="list citation-list" style={{ marginTop: 12, gap: 8 }}>
      {citations.map((citation) => (
        <div
          key={`${citation.documentId}-${citation.page}-${citation.excerpt}`}
          className="list-item"
          style={{ padding: 10, gap: 10, alignItems: 'flex-start' }}
        >
          <span className="lead" style={{ width: 28, height: 28, flex: 'none' }}>
            <span className="ms sm">description</span>
          </span>
          <span className="body" style={{ minWidth: 0 }}>
            <span className="t">{citation.documentName}</span>
            <span
              className="s"
              style={{
                display: 'block',
                whiteSpace: 'normal',
                overflow: 'visible',
                textOverflow: 'clip',
              }}
            >
              صفحة {citation.page} · {citation.excerpt}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
