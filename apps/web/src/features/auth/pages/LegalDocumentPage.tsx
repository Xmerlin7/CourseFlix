import { Link, useNavigate } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { LEGAL_LAST_UPDATED, type LegalSection } from '../lib/legal-content'

interface LegalDocumentPageProps {
  title: string
  sections: LegalSection[]
}

export function LegalDocumentPage({ title, sections }: LegalDocumentPageProps) {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <header className="legal-page-header">
        <Link to={ROUTE_PATHS.ROOT} className="logo">
          COURSEFLIX
        </Link>
        <button type="button" className="btn text" onClick={() => navigate(-1)}>
          <span className="ms">arrow_forward</span>
          رجوع
        </button>
      </header>

      <main className="legal-doc">
        <h1 className="page-title">{title}</h1>
        {sections.map((section) => (
          <div key={section.heading} className="legal-section">
            <p className="legal-heading">{section.heading}</p>
            <p className="legal-body">{section.body}</p>
          </div>
        ))}
        <p className="legal-updated">آخر تحديث: {LEGAL_LAST_UPDATED}</p>
      </main>
    </div>
  )
}
