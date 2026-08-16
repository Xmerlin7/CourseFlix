import { Link, useNavigate } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { LEGAL_LAST_UPDATED, type LegalSection } from '../lib/legal-content'

interface LegalDocumentPageProps {
  title: string
  sections: LegalSection[]
}

export function LegalDocumentPage({ title, sections }: LegalDocumentPageProps) {
  const navigate = useNavigate()

  // The register wizard opens this page with target="_blank" — deliberately,
  // so reading the terms doesn't unmount the wizard and lose everything the
  // user already typed. That means this often loads as a brand-new tab with
  // no history to go back to: navigate(-1) here was silently a no-op. When
  // there's nowhere to go back to, closing the tab *is* "back" — it returns
  // the user to the wizard tab they came from, same as the browser's own
  // window-close would. Only self-opened tabs (target="_blank" is exactly
  // that) can be closed this way; on a real back-navigable history, or if
  // the browser blocks the close, this simply falls through and does
  // nothing further to click.
  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    window.close()
  }

  return (
    <div className="legal-page">
      <header className="legal-page-header">
        <Link to={ROUTE_PATHS.ROOT} className="logo">
          COURSEFLIX
        </Link>
        <button type="button" className="btn text" onClick={handleBack}>
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
