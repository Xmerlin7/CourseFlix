import { useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useAuth } from '../../auth/hooks/useAuth'
import { TeacherWhatsappContactForm } from '../../profile/components/TeacherWhatsappContactForm'
import { AdminAuthPosterSettingsForm } from '../components/AdminAuthPosterSettingsForm'
import { AppearanceSettingsForm } from '../components/AppearanceSettingsForm'
import { ExperienceSettingsForm } from '../components/ExperienceSettingsForm'
import { NotificationSettingsForm } from '../components/NotificationSettingsForm'

type SettingsTab = 'appearance' | 'experience' | 'notifications' | 'student-contact' | 'auth-poster'

const TABS: Array<{ value: SettingsTab; label: string; icon: string }> = [
  { value: 'appearance', label: 'المظهر', icon: 'palette' },
  { value: 'experience', label: 'تجربة الاستخدام', icon: 'tune' },
  { value: 'notifications', label: 'الإشعارات', icon: 'notifications' },
]

const ADMIN_TABS: Array<{ value: SettingsTab; label: string; icon: string }> = [
  { value: 'auth-poster', label: 'واجهة الدخول', icon: 'login' },
]

const TEACHER_TABS: Array<{ value: SettingsTab; label: string; icon: string }> = [
  { value: 'student-contact', label: 'تواصل الطلاب', icon: 'forum' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
  const tabs =
    user?.role === 'admin'
      ? [...TABS, ...ADMIN_TABS]
      : user?.role === 'teacher'
        ? [...TABS, ...TEACHER_TABS]
        : TABS

  return (
    <>
      <PageHeader title="الإعدادات" description="خصّص شكل التطبيق وتفضيلات الإشعارات اللي تناسبك" />

      <div className="settings-shell">
        <nav className="settings-nav" aria-label="أقسام الإعدادات">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`nav-item${activeTab === tab.value ? ' active' : ''}`}
              aria-current={activeTab === tab.value ? 'page' : undefined}
            >
              <span className={`ms${activeTab === tab.value ? ' fill' : ''}`}>{tab.icon}</span>
              <span className="lbl">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {activeTab === 'appearance' && <AppearanceSettingsForm />}
          {activeTab === 'experience' && <ExperienceSettingsForm />}
          {activeTab === 'notifications' && <NotificationSettingsForm />}
          {activeTab === 'student-contact' && <TeacherWhatsappContactForm />}
          {activeTab === 'auth-poster' && <AdminAuthPosterSettingsForm />}
        </div>
      </div>
    </>
  )
}
