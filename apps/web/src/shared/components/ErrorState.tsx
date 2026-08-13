import { RefreshCw } from 'lucide-react'
import { ErrorIllustration } from './illustrations/ErrorIllustration'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'حدث خطأ ما',
  message = 'تعذر تحميل المحتوى، حاول مرة أخرى',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-3 px-6 py-12 text-center"
      role="alert"
    >
      {/* Illustration with subtle floating animation */}
      <div className="animate-float">
        <ErrorIllustration className="w-64 h-auto" />
      </div>

      {/* Text content */}
      <div className="space-y-2.5 max-w-md">
      {/* Design-system tokens, not Tailwind grays: every other heading and
          body copy in the app is `--on-surface`/`--on-surface-variant`,
          which the theme redefines per mode and the accent picker tunes.
          The `text-gray-800 dark:text-gray-100` pair these carried was a
          near-miss of both, so the error screens rendered in a slightly
          different grey from the pages they interrupt. */}
        <h3 className="text-2xl font-bold leading-snug" style={{ color: 'var(--on-surface)' }}>
          {title}
        </h3>
        <p className="text-base leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
          {message}
        </p>
      </div>

      {/* Uses the shared .btn design-system class rather than ad-hoc
          Tailwind: .btn pairs var(--primary) with var(--on-primary), the
          contrast-checked foreground the accent picker computes. The old
          hardcoded `text-white` went unreadable on a light accent. */}
      {onRetry && (
        <button type="button" className="btn big group mt-4 cursor-pointer" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
          إعادة المحاولة
        </button>
      )}
    </div>
  )
}