import { useState } from 'react'
import { BookOpen } from 'lucide-react'

interface CourseThumbProps {
  coverImageUrl: string | null
  alt: string
  className?: string
}

/**
 * Real cover image when the course has one, or a polished Courseflix
 * placeholder otherwise. Shared by course cards across the application.
 */
export function CourseThumb({ coverImageUrl, alt, className = '' }: CourseThumbProps) {
  const [failed, setFailed] = useState(false)

  const containerClass = `thumb ${className}`.trim()

  if (coverImageUrl && !failed) {
    return (
      <div className={containerClass}>
        <img
          src={coverImageUrl}
          alt={alt}
          loading="lazy"
          className="thumb-img"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className={`${containerClass} thumb-placeholder`} aria-hidden="true">
      <div className="thumb-placeholder-pattern" />
      <div className="thumb-placeholder-content">
        <div className="thumb-icon-badge">
          <BookOpen className="thumb-icon" size={26} strokeWidth={1.8} />
        </div>
        <span className="thumb-brand">COURSEFLIX</span>
      </div>
    </div>
  )
}

