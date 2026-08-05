import { Link } from 'react-router'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <>
      <LoginForm />
      <p className="auth-switch">
        مستخدم جديد؟ <Link to="/register">إنشاء حساب</Link>
      </p>
    </>
  )
}
