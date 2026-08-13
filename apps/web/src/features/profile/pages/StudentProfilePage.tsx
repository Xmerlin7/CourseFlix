import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ApiError } from '../../../shared/api/api-error'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { APP_VERSION } from '../../../shared/lib/app-version'
import { useAuth } from '../../auth/hooks/useAuth'
import { updateProfile, uploadAvatar } from '../api/profile.api'
import { AvatarPickerModal } from '../components/AvatarPickerModal'

export function StudentProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  // `user` is guaranteed non-null here — this route only renders inside
  // RequireRole("student"), which already redirects to /login otherwise.
  const currentUser = user!

  const [fullName, setFullName] = useState(currentUser.fullName)
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const isNameDirty = fullName.trim() !== currentUser.fullName
  const isNameValid = fullName.trim().length >= 2 && fullName.trim().length <= 150

  async function handleSaveName(event: React.FormEvent) {
    event.preventDefault()
    if (!isNameDirty || !isNameValid) return

    setIsSavingName(true)
    setNameError(null)
    try {
      const updated = await updateProfile({ fullName: fullName.trim() })
      updateUser(updated)
      setFullName(updated.fullName)
      showToast('اتحفظ الاسم بنجاح', 'success')
    } catch (err) {
      setNameError('تعذر حفظ الاسم، حاول مرة أخرى')
      showToast(err instanceof ApiError ? 'حصل خطأ أثناء الحفظ' : 'حصل خطأ غير متوقع', 'error')
    } finally {
      setIsSavingName(false)
    }
  }

  async function handleSelectAvatar(avatarUrl: string) {
    if (avatarUrl === currentUser.avatarUrl) {
      setIsAvatarPickerOpen(false)
      return
    }

    setIsSavingAvatar(true)
    try {
      const updated = await updateProfile({ avatarUrl })
      updateUser(updated)
      showToast('اتحفظت الصورة الرمزية', 'success')
      setIsAvatarPickerOpen(false)
    } catch {
      showToast('تعذر حفظ الصورة الرمزية، حاول مرة أخرى', 'error')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  // Upload has its own success/failure path (server-side, Cloudinary-
  // backed) — errors are re-thrown so AvatarPickerModal can show them
  // inline next to the "+" tile instead of a generic toast.
  async function handleUploadAvatar(file: File) {
    const updated = await uploadAvatar(file)
    updateUser(updated)
    showToast('اتحفظت الصورة الرمزية', 'success')
    setIsAvatarPickerOpen(false)
  }

  async function handleLogout() {
    await logout()
    navigate(ROUTE_PATHS.LOGIN, { replace: true })
  }

  // No self-service account-deletion endpoint exists on the backend yet
  // (only an admin-only hard-delete on another user). Rather than fake a
  // call that pretends to succeed, this surfaces that plainly instead of
  // silently doing nothing — swap this for a real API call once that
  // route exists.
  function handleConfirmDelete() {
    setIsDeleteConfirmOpen(false)
    showToast('حذف الحساب مش متاح من هنا لسه — تواصل مع معلمك لإتمام الطلب', 'error')
  }

  return (
    <div className="profile-page">
      {/* Back control and page title on their own row. They used to share
          a row with the name and the avatar, which put a 20px heading
          between a 40px button and an 88px avatar — `text-align: center`
          then centred it in the leftover space, so it never lined up with
          anything above or below it. */}
      <header className="profile-topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate(-1)}
          aria-label="رجوع"
        >
          <span className="ms">arrow_forward</span>
        </button>
        <h1 className="profile-page-title">الملف الشخصي</h1>
      </header>

      <section className="card profile-identity-card">
        <div className="profile-avatar-wrap">
          <span className="avatar profile-avatar-lg">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" />
            ) : (
              <span className="ms">person</span>
            )}
          </span>
          <button
            type="button"
            className="profile-avatar-edit-btn"
            onClick={() => setIsAvatarPickerOpen(true)}
            aria-label="تغيير الصورة الرمزية"
          >
            <span className="ms sm fill">edit</span>
          </button>
        </div>

        <div className="profile-identity-text">
          <p className="profile-identity-name">{currentUser.fullName}</p>
          {/* bdi: the address is Latin inside an RTL paragraph, so without
              isolation the bidi algorithm drags trailing punctuation to
              the wrong end of it. */}
          <p className="profile-identity-email">
            <bdi>{currentUser.email}</bdi>
          </p>
          <span className="chip">طالب</span>
        </div>
      </section>

      <form className="card profile-form-card" onSubmit={(e) => void handleSaveName(e)}>
        <div className="profile-card-head">
          <h3 className="profile-card-title">البيانات الأساسية</h3>
          <p className="profile-card-sub">اسمك كما يظهر لمعلمك وفي المناقشات.</p>
        </div>

        <div className={`tf${nameError ? ' invalid' : ''}`}>
          <label htmlFor="profile-full-name">الاسم الكامل *</label>
          <input
            id="profile-full-name"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              setNameError(null)
            }}
            minLength={2}
            maxLength={150}
            required
            disabled={isSavingName}
          />
          {nameError && <span className="error-text">{nameError}</span>}
        </div>

        <div className="tf" style={{ marginBottom: 0 }}>
          <label>البريد الإلكتروني</label>
          <input type="email" value={currentUser.email} disabled readOnly />
          <span className="hint">لتغيير البريد الإلكتروني، تواصل مع معلمك.</span>
        </div>

        {isNameDirty && (
          <div className="profile-form-actions">
            <button
              type="button"
              className="btn text"
              onClick={() => {
                setFullName(currentUser.fullName)
                setNameError(null)
              }}
              disabled={isSavingName}
            >
              تراجع
            </button>
            <button type="submit" className="btn" disabled={isSavingName || !isNameValid}>
              {isSavingName && <span className="ms spin">progress_activity</span>}
              {isSavingName ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        )}
      </form>

      <section className="section profile-nav-list">
        <h3 className="profile-card-title profile-nav-title">اختصارات</h3>

        <Link to={ROUTE_PATHS.STUDENT.COURSES} className="list-item hoverable">
          <span className="lead">
            <span className="ms">menu_book</span>
          </span>
          <span className="body">
            <span className="t">دوراتي</span>
          </span>
          <span className="end">
            <span className="ms">chevron_left</span>
          </span>
        </Link>

        <Link to={ROUTE_PATHS.STUDENT.NOTIFICATIONS} className="list-item hoverable">
          <span className="lead">
            <span className="ms">notifications</span>
          </span>
          <span className="body">
            <span className="t">الإشعارات</span>
          </span>
          <span className="end">
            <span className="ms">chevron_left</span>
          </span>
        </Link>

        {/* "مشترياتي" and "تواصل مع الدعم" have no backing route/API yet
            (no student-facing purchase-history list endpoint, no support
            contact channel anywhere in the app) — shown disabled rather
            than either omitted (they're real, requested product surfaces)
            or wired to a fake destination. */}
        <div className="list-item profile-nav-disabled" aria-disabled="true">
          <span className="lead">
            <span className="ms">receipt_long</span>
          </span>
          <span className="body">
            <span className="t">مشترياتي</span>
          </span>
          <span className="end">
            <span className="chip outline">قريبًا</span>
          </span>
        </div>

        <div className="list-item profile-nav-disabled" aria-disabled="true">
          <span className="lead">
            <span className="ms">support_agent</span>
          </span>
          <span className="body">
            <span className="t">تواصل مع الدعم</span>
          </span>
          <span className="end">
            <span className="chip outline">قريبًا</span>
          </span>
        </div>
      </section>

      <footer className="profile-footer">
        <div className="profile-footer-links">
          <Link to={ROUTE_PATHS.TERMS} className="btn text">
            الشروط والأحكام
          </Link>
          <Link to={ROUTE_PATHS.PRIVACY} className="btn text">
            سياسة الخصوصية
          </Link>
        </div>

        <div className="profile-footer-actions">
          <button type="button" className="btn outlined" onClick={() => void handleLogout()}>
            <span className="ms">logout</span>
            تسجيل الخروج
          </button>
          <button
            type="button"
            className="btn text profile-delete-btn"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            حذف الحساب
          </button>
        </div>

        <p className="profile-version">الإصدار {APP_VERSION}</p>
      </footer>

      <AvatarPickerModal
        open={isAvatarPickerOpen}
        selectedUrl={currentUser.avatarUrl}
        isSaving={isSavingAvatar}
        onSelect={(url) => void handleSelectAvatar(url)}
        onUpload={handleUploadAvatar}
        onClose={() => setIsAvatarPickerOpen(false)}
      />

      <ConfirmModal
        open={isDeleteConfirmOpen}
        variant="danger"
        title="حذف الحساب"
        message="هذا الإجراء نهائي وسيؤدي لفقدان كل بياناتك، دوراتك، وتقدمك التعليمي بشكل دائم. هل أنت متأكد؟"
        confirmLabel="حذف الحساب"
        cancelLabel="إلغاء"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  )
}
