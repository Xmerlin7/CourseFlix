import { useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useAuth } from '../../auth/hooks/useAuth'
import { AgentSettingsForm } from '../../lesson-agents/components/AgentSettingsForm'
import { TeacherWhatsappContactForm } from '../../profile/components/TeacherWhatsappContactForm'
import { AppearanceSettingsForm } from '../components/AppearanceSettingsForm'
import { ExperienceSettingsForm } from '../components/ExperienceSettingsForm'
import { NotificationSettingsForm } from '../components/NotificationSettingsForm'

type SettingsTab =
  | 'appearance'
  | 'experience'
  | 'notifications'
  | 'student-contact'
  | 'agents'

const TABS: Array<{ value: SettingsTab; label: string; icon: string }> = [
  { value: 'appearance', label: 'المظهر', icon: 'palette' },
  { value: 'experience', label: 'تجربة الاستخدام', icon: 'tune' },
  { value: 'notifications', label: 'الإشعارات', icon: 'notifications' },
]

const TEACHER_TABS: Array<{ value: SettingsTab; label: string; icon: string }> = [
  { value: 'student-contact', label: 'تواصل الطلاب', icon: 'forum' },
  { value: 'agents', label: 'وكلاء الدروس', icon: 'smart_toy' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
  const tabs = user?.role === 'teacher' ? [...TABS, ...TEACHER_TABS] : TABS

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
          {activeTab === 'agents' && <AgentSettingsForm />}
        </div>
      </div>
    </>
  )
}
