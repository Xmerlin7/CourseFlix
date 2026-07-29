import type { PropsWithChildren, ReactNode } from 'react'

type PageHeaderProps = PropsWithChildren<{
  title: string
  description?: string
  actions?: ReactNode
}>

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="section-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="subtitle" style={{ marginBottom: 0 }}>{description}</p>}
      </div>

      {actions && <div className="actions">{actions}</div>}
      {children}
    </div>
  )
}
