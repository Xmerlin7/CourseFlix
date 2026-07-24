import { RouterProvider } from 'react-router'
import { router } from './router'

/**
 * AppRouter component providing the React Router Data Router to the application.
 */
export function AppRouter() {
  return <RouterProvider router={router} />
}
