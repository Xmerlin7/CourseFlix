import { useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { AppearanceSettingsForm } from '../components/AppearanceSettingsForm'
import { NotificationSettingsForm } from '../components/NotificationSettingsForm'
import { ProfileSettingsForm } from '../components/ProfileSettingsForm'
import { SecuritySettingsForm } from '../components/SecuritySettingsForm'

type SettingsTab = 'profile' | 'security' | 'appearance' | 'notifications'

const TABS: Array<{ value: SettingsTab; label: string }> = [
  { value: 'profile', label: 'الملف الشخصي' },
  { value: 'security', label: 'الأمان' },
  { value: 'appearance', label: 'المظهر' },
  { value: 'notifications', label: 'الإشعارات' },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <>
      <PageHeader title="الإعدادات" description="تحكّم في ملفك الشخصي وتفضيلات حسابك" />

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`tab${activeTab === tab.value ? ' active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 640 }}>
        {activeTab === 'profile' && <ProfileSettingsForm />}
        {activeTab === 'security' && <SecuritySettingsForm />}
        {activeTab === 'appearance' && <AppearanceSettingsForm />}
        {activeTab === 'notifications' && <NotificationSettingsForm />}
      </div>
    </>
  )
}
