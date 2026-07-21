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
      className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center"
      role="alert"
    >
      {/* Illustration with subtle floating animation */}
      <div className="animate-float">
        <ErrorIllustration className="w-48 h-auto" />
      </div>

      {/* Text content */}
      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Retry button with icon spin on hover */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="group mt-4 inline-flex items-center gap-2.5 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl
                     hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25
                     active:scale-[0.97] transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
          إعادة المحاولة
        </button>
      )}
    </div>
  )
}