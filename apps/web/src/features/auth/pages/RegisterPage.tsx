import { Link } from 'react-router'
import { RegisterForm } from '../components/RegisterForm'
import { SocialLoginButtons } from '../components/SocialLoginButtons'

export function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <SocialLoginButtons />
      <p className="auth-switch">
        عندك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
      </p>
    </>
  )
}
