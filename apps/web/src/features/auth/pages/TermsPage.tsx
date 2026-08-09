import { LegalDocumentPage } from './LegalDocumentPage'
import { TERMS_SECTIONS } from '../lib/legal-content'

export function TermsPage() {
  return <LegalDocumentPage title="الشروط والأحكام" sections={TERMS_SECTIONS} />
}
