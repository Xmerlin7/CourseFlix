import { Link } from 'react-router'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <p className="auth-switch">
        عندك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
      </p>
    </>
  )
}
