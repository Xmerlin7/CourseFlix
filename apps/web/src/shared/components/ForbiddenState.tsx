import { ArrowRight } from 'lucide-react'
import { ForbiddenIllustration } from './illustrations/ForbiddenIllustration'

type ForbiddenStateProps = {
  title?: string
  message?: string
  onGoBack?: () => void
  goBackLabel?: string
}

export function ForbiddenState({
  title = 'غير مسموح لك بالوصول',
  message = 'ليس لديك الصلاحية الكافية لعرض هذه الصفحة',
  onGoBack,
  goBackLabel = 'الرجوع للصفحة الرئيسية',
}: ForbiddenStateProps) {
  return (
    <div
      className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-3 px-6 py-16 text-center"
      role="alert"
    >
      {/* Illustration */}
      <ForbiddenIllustration className="w-96 max-w-full h-auto" />

      {/* Text content */}
      <div className="space-y-2.5 max-w-md">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Uses the shared .btn design-system class rather than ad-hoc
          Tailwind: .btn pairs var(--primary) with var(--on-primary), the
          contrast-checked foreground the accent picker computes. The old
          hardcoded `text-white` went unreadable on a light accent. */}
      {onGoBack && (
        <button type="button" className="btn big mt-4 cursor-pointer" onClick={onGoBack}>
          {/* RTL: "back" points right, matching the arrow_forward the
              register wizard already uses for its السابق control. */}
          <ArrowRight className="w-4 h-4" />
          {goBackLabel}
        </button>
      )}
    </div>
  )
}