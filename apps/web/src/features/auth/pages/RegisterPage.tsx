import { Link } from 'react-router'
import { RegisterForm } from '../components/RegisterForm'
import { SocialLoginButtons } from '../components/SocialLoginButtons'

export function RegisterPage() {
  return (
    <div className="cfa-enter">
      <header className="cfa-head">
        <h1 className="cfa-title">ابدأ رحلتك</h1>
        <p className="cfa-subtitle">
          أنشئ حسابك في أقل من دقيقة، وابدأ أول حصة النهاردة.
        </p>
      </header>

      <RegisterForm />

      <SocialLoginButtons />

      <p className="cfa-switch">
        عندك حساب بالفعل؟<Link to="/login">تسجيل الدخول</Link>
      </p>
    </div>
  )
}
