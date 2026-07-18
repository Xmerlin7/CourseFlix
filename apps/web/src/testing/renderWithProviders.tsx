import type { ReactElement } from 'react'
import { AppProviders } from '../app/providers/AppProviders'

export function renderWithProviders(ui: ReactElement) {
  // TODO: wrap testing-library render with app providers when test deps are added.
  return <AppProviders>{ui}</AppProviders>
}
