import { useState } from 'react'

interface CourseThumbProps {
  coverImageUrl: string | null
  alt: string
}

/**
 * Real cover image when the course has one, the ui5 abstract-shapes
 * placeholder otherwise. Shared by every course card (student/teacher)
 * so the fallback and image treatment never drift between them.
 */
export function CourseThumb({ coverImageUrl, alt }: CourseThumbProps) {
  const [failed, setFailed] = useState(false)

  if (coverImageUrl && !failed) {
    return (
      <div className="thumb">
        <img
          src={coverImageUrl}
          alt={alt}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className="thumb" aria-hidden="true">
      <i className="t1" />
      <i className="t2" />
      <i className="t3" />
    </div>
  )
}
