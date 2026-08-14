import { useEffect, useState } from 'react'
import { getTeacherContact, type TeacherContact } from '../api/teacher-contact.api'

export function TeacherWhatsappButton() {
  const [contact, setContact] = useState<TeacherContact | null>(null)

  useEffect(() => {
    let cancelled = false

    getTeacherContact()
      .then((result) => {
        if (!cancelled) setContact(result.whatsappHref ? result : null)
      })
      .catch(() => {
        if (!cancelled) setContact(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!contact?.whatsappHref) return null

  return (
    <a
      className="teacher-whatsapp-fab"
      href={contact.whatsappHref}
      target="_blank"
      rel="noreferrer"
      aria-label={`تواصل مع ${contact.teacherName || 'المعلم'} عبر واتساب`}
    >
      <span className="ms fill" aria-hidden="true">chat</span>
      <span>واتساب</span>
    </a>
  )
}
