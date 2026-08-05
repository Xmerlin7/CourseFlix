import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../app/providers/AppProviders'
import { AuthContext, type AuthContextValue } from '../features/auth/context/AuthContext'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  auth?: AuthContextValue
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { initialEntries = ['/'], auth, ...renderOptions } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    const routed = <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>

    if (auth) {
      return <AuthContext.Provider value={auth}>{routed}</AuthContext.Provider>
    }

    return <AppProviders>{routed}</AppProviders>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
