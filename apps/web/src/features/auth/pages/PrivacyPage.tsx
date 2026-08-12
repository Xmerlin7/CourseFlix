import { LegalDocumentPage } from './LegalDocumentPage'
import { PRIVACY_SECTIONS } from '../lib/legal-content'

export function PrivacyPage() {
  return <LegalDocumentPage title="سياسة الخصوصية" sections={PRIVACY_SECTIONS} />
}
