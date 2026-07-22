import type { PropsWithChildren, ReactNode } from 'react'

type PageHeaderProps = PropsWithChildren<{
  title: string
  description?: string
  actions?: ReactNode
}>

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-5 mb-6 border-b border-gray-200/70 dark:border-gray-800/80 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {/* Subtle primary accent indicator */}
        <span className="w-1.5 h-7 mt-1 rounded-full bg-primary shrink-0" />
        
        <div className="space-y-1 min-w-0 text-right">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 !m-0 !p-0 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm font-normal text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}

      {children}
    </div>
  )
}