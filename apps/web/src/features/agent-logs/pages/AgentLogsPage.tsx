import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { useAgentLogs } from '../hooks/useAgentLogs'
import { AgentLogsSkeleton } from '../components/AgentLogsSkeleton'
import type { AgentLogStatus, AgentType } from '../types/agent-log.types'

const AGENT_TYPE_LABEL: Record<AgentType, string> = {
  content_scout: 'استكشاف المحتوى',
  proactive_proctor: 'المراقب الاستباقي',
  tutor_llm: 'المساعد الذكي',
  analytics_agent: 'وكيل التحليلات',
}

const STATUS_LABEL: Record<AgentLogStatus, string> = {
  success: 'نجاح',
  failed: 'فشل',
  retrying: 'إعادة محاولة',
  skipped: 'تم التجاوز',
}

const STATUS_CHIP_CLASS: Record<AgentLogStatus, string> = {
  success: 'green',
  failed: 'pink',
  retrying: '',
  skipped: '',
}

const AGENT_TYPE_OPTIONS: Array<{ label: string; value: AgentType | '' }> = [
  { label: 'كل الأنواع', value: '' },
  ...(Object.entries(AGENT_TYPE_LABEL) as Array<[AgentType, string]>).map(([value, label]) => ({
    value,
    label,
  })),
]

const STATUS_OPTIONS: Array<{ label: string; value: AgentLogStatus | '' }> = [
  { label: 'الكل', value: '' },
  ...(Object.entries(STATUS_LABEL) as Array<[AgentLogStatus, string]>).map(([value, label]) => ({
    value,
    label,
  })),
]

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function AgentLogsPage() {
  const [agentType, setAgentType] = useState<AgentType | ''>('')
  const [status, setStatus] = useState<AgentLogStatus | ''>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useAgentLogs({
    agentType: agentType || undefined,
    status: status || undefined,
  })

  return (
    <>
      <h1 className="page-title">سجل الوكيل</h1>
      <p className="subtitle">سجل تتبّع آمن لعمليات المراقب الاستباقي ووكيل التحليلات في دوراتك</p>

      <div className="actions section">
        {AGENT_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value || 'all-types'}
            type="button"
            onClick={() => setAgentType(option.value)}
            className={`chip clickable outline${agentType === option.value ? ' selected' : ''}`}
            aria-pressed={agentType === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="actions section">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value || 'all-status'}
            type="button"
            onClick={() => setStatus(option.value)}
            className={`chip clickable outline${status === option.value ? ' selected' : ''}`}
            aria-pressed={status === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && <AgentLogsSkeleton />}

      {!isLoading &&
        error &&
        (error.status === 403 ? <ForbiddenState /> : <ErrorState onRetry={refetch} />)}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          title="لا يوجد نشاط مسجل"
          message="هيظهر هنا أي عملية قام بها المراقب الاستباقي أو وكيل التحليلات على دوراتك"
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="list">
          {data.map((log) => {
            const isExpanded = expandedId === log.id

            return (
              <div key={log.id} className="list-item hoverable" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  aria-expanded={isExpanded}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span className="lead">
                    <span className="ms">smart_toy</span>
                  </span>

                  <span className="body">
                    <span className="t">{log.action}</span>
                    <span className="s">{AGENT_TYPE_LABEL[log.agentType]}</span>
                  </span>

                  <span className="end">
                    <span className={`chip outline ${STATUS_CHIP_CLASS[log.status]}`}>
                      {STATUS_LABEL[log.status]}
                    </span>
                    {formatDateTime(log.executedAt)}
                  </span>
                </button>

                {isExpanded && (
                  <div className="s" style={{ marginTop: 8, paddingInlineStart: 40 }}>
                    <div>معرف التتبع: {log.correlationId ?? '—'}</div>
                    {log.durationMs !== null && <div>المدة: {log.durationMs} مللي ثانية</div>}
                    {log.tokensUsed !== null && <div>عدد التوكنز: {log.tokensUsed}</div>}
                    {log.rowCount !== null && <div>عدد النتائج: {log.rowCount}</div>}
                    {log.errorMessage && <div>الخطأ: {log.errorMessage}</div>}
                    {log.metadata && (
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
