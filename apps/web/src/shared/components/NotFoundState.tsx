import { Home } from 'lucide-react'
import { NotFoundIllustration } from './illustrations/NotFoundIllustration'

type NotFoundStateProps = {
  title?: string
  message?: string
  onGoHome?: () => void
}

export function NotFoundState({
  title = 'عفواً!... الصفحة غير موجودة',
  message = 'عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.',
  onGoHome,
}: NotFoundStateProps) {
  return (
    <div
      className="flex min-h-[70vh] w-full max-w-full flex-col items-center justify-center gap-5 overflow-hidden px-4 py-10 text-center"
      role="alert"
      dir="rtl"
    >
      {/* Educational 404 Scene Illustration with Blob background */}
      <div className="relative flex w-full max-w-xs items-center justify-center overflow-hidden sm:max-w-sm">
        <NotFoundIllustration className="w-full h-auto" />
      </div>

      {/* Main Title & Message with verified High Contrast Dark Mode Classes */}
      <div className="space-y-2 max-w-md px-2">
        <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Uses the shared .btn design-system class rather than ad-hoc
          Tailwind: .btn pairs var(--primary) with var(--on-primary), the
          contrast-checked foreground the accent picker computes. The old
          hardcoded `text-white` went unreadable on a light accent. */}
      {onGoHome && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="btn big cursor-pointer" onClick={onGoHome}>
            <Home className="w-4 h-4" />
            الرجوع للصفحة الرئيسية
          </button>
        </div>
      )}
    </div>
  )
}
