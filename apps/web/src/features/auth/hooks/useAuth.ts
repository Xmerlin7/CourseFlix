import type { AuthUser, LoginPayload } from '../types/auth.types'

export function useAuth() {
  // TODO: connect auth queries/mutations and expose role-aware redirect helpers.
  const user: AuthUser | null = null

  return {
    user,
    login: async (payload: LoginPayload) => {
      void payload
    },
    logout: async () => {},
  }
}
