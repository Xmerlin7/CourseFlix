import { useState } from 'react'
import { CourseThumbPlaceholder } from './CourseThumbPlaceholder'

interface CourseThumbProps {
  coverImageUrl: string | null
  alt: string
  className?: string
}

/**
 * Real cover image when the course has one, or Material 3 shape artwork
 * otherwise. Shared by course cards across the application.
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
      <CourseThumbPlaceholder seed={alt} />
    </div>
  )
}

