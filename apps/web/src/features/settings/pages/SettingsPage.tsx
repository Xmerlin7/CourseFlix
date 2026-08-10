import { useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { AppearanceSettingsForm } from '../components/AppearanceSettingsForm'
import { NotificationSettingsForm } from '../components/NotificationSettingsForm'

type SettingsTab = 'appearance' | 'notifications'

const TABS: Array<{ value: SettingsTab; label: string; icon: string }> = [
  { value: 'appearance', label: 'المظهر', icon: 'palette' },
  { value: 'notifications', label: 'الإشعارات', icon: 'notifications' },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')

  return (
    <>
      <PageHeader title="الإعدادات" description="خصّص شكل التطبيق وتفضيلات الإشعارات اللي تناسبك" />

      <div className="settings-shell">
        <nav className="settings-nav" aria-label="أقسام الإعدادات">
          {TABS.map((tab) => (
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
          {activeTab === 'notifications' && <NotificationSettingsForm />}
        </div>
      </div>
    </>
  )
}
