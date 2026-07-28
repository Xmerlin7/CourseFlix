import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../app/providers/AppProviders'
import { AuthContext, type AuthContextValue } from '../features/auth/context/AuthContext'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  auth?: Partial<AuthContextValue>
}

const signedOutAuth: AuthContextValue = {
  user: null,
  isLoading: false,
  login: async () => {
    throw new Error('renderWithProviders login mock was not provided.')
  },
  logout: async () => undefined,
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', auth, ...renderOptions }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const content = auth ? (
      <AuthContext.Provider value={{ ...signedOutAuth, ...auth }}>{children}</AuthContext.Provider>
    ) : (
      <AppProviders>{children}</AppProviders>
    )

    return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
