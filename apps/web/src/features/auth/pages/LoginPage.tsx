import { Link } from 'react-router'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <>
      <LoginForm />
      <p className="mt-4 text-center text-sm">
        Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Create a new account</Link>
      </p>
    </>
  )
}
