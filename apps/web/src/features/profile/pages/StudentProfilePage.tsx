import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ApiError } from '../../../shared/api/api-error'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { APP_VERSION } from '../../../shared/lib/app-version'
import { useAuth } from '../../auth/hooks/useAuth'
import { TeacherQuotaCard } from '../../teacher-billing/components/TeacherQuotaCard'
import { updateProfile, uploadAvatar } from '../api/profile.api'
import { AvatarPickerModal } from '../components/AvatarPickerModal'
import type { UserRole } from '../../auth/types/auth.types'

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'طالب',
  teacher: 'معلم',
  assistant: 'مساعد المعلم',
  admin: 'مسؤول المنصة',
}

interface Shortcut {
  to: string
  label: string
  icon: string
}

/**
 * Where each role's profile page can send them. Kept per-role rather than
 * one shared list because the destinations genuinely differ — a teacher
 * has no "دوراتي" in the student sense, and an admin has neither.
 */
const SHORTCUTS_BY_ROLE: Record<UserRole, Shortcut[]> = {
  student: [
    { to: ROUTE_PATHS.STUDENT.COURSES, label: 'دوراتي', icon: 'menu_book' },
    { to: ROUTE_PATHS.STUDENT.NOTIFICATIONS, label: 'الإشعارات', icon: 'notifications' },
    { to: ROUTE_PATHS.STUDENT.SETTINGS, label: 'الإعدادات', icon: 'settings' },
  ],
  teacher: [
    { to: ROUTE_PATHS.TEACHER.COURSES, label: 'دوراتي', icon: 'menu_book' },
    { to: ROUTE_PATHS.TEACHER.STUDENTS, label: 'الطلاب', icon: 'groups' },
    { to: ROUTE_PATHS.TEACHER.NOTIFICATIONS, label: 'الإشعارات', icon: 'notifications' },
    { to: ROUTE_PATHS.TEACHER.SETTINGS, label: 'الإعدادات', icon: 'settings' },
  ],
  assistant: [
    { to: ROUTE_PATHS.TEACHER.COURSES, label: 'الدورات', icon: 'menu_book' },
    { to: ROUTE_PATHS.TEACHER.STUDENTS, label: 'الطلاب', icon: 'groups' },
    { to: ROUTE_PATHS.TEACHER.SUPPORT, label: 'صندوق الدعم', icon: 'support_agent' },
    { to: ROUTE_PATHS.TEACHER.SETTINGS, label: 'الإعدادات', icon: 'settings' },
  ],
  admin: [
    { to: ROUTE_PATHS.ADMIN.USERS, label: 'المستخدمون', icon: 'manage_accounts' },
    { to: ROUTE_PATHS.ADMIN.COURSES, label: 'الدورات', icon: 'menu_book' },
    { to: ROUTE_PATHS.ADMIN.SETTINGS, label: 'الإعدادات', icon: 'settings' },
  ],
}

/**
 * The profile page for every role, not just students — the file keeps its
 * original name because that's what the router and its spec import.
 * Everything role-specific (the badge, the shortcut list, whether the
 * "purchases" row shows at all) comes off `user.role`.
 */
export function StudentProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  // `user` is guaranteed non-null here — every route that renders this
  // page sits inside a RequireRole, which redirects to /login otherwise.
  const currentUser = user!
  const isStudent = currentUser.role === 'student'

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
      {/* No back button or page title: the sidebar already says which
          page this is, and the identity card below names the user, so
          both were redundant chrome above the real content. */}
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
          <span className="chip">{ROLE_LABEL[currentUser.role]}</span>
        </div>
      </section>

      <form className="card profile-form-card" onSubmit={(e) => void handleSaveName(e)}>
        <div className="profile-card-head">
          <h3 className="profile-card-title">البيانات الأساسية</h3>
          <p className="profile-card-sub">
            {isStudent
              ? 'اسمك كما يظهر لمعلمك وفي المناقشات.'
              : 'اسمك كما يظهر لباقي المستخدمين على المنصة.'}
          </p>
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
          <span className="hint">
            {isStudent
              ? 'لتغيير البريد الإلكتروني، تواصل مع معلمك.'
              : 'لتغيير البريد الإلكتروني، تواصل مع مسؤول المنصة.'}
          </span>
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

      {/* Billing is teacher-only — assistants are blocked server-side on
          the quota route and never reach this branch anyway. */}
      {currentUser.role === 'teacher' && <TeacherQuotaCard />}

      <section className="section profile-nav-list">
        <h3 className="profile-card-title profile-nav-title">اختصارات</h3>

        {SHORTCUTS_BY_ROLE[currentUser.role].map((shortcut) => (
          <Link key={shortcut.to} to={shortcut.to} className="list-item hoverable">
            <span className="lead">
              <span className="ms">{shortcut.icon}</span>
            </span>
            <span className="body">
              <span className="t">{shortcut.label}</span>
            </span>
            <span className="end">
              <span className="ms">chevron_left</span>
            </span>
          </Link>
        ))}

        {/* "مشترياتي" has no backing route/API yet — there's no
            student-facing purchase-history endpoint. Shown disabled
            rather than omitted (it's a real, requested surface) or wired
            to a fake destination. Students only: nobody else buys
            anything. */}
        {isStudent && (
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
        )}
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
