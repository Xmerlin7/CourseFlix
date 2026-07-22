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
      className="flex flex-col items-center justify-center gap-4 py-4 sm:py-6 px-4 text-center w-full max-w-full overflow-hidden my-auto"
      role="alert"
      dir="rtl"
    >
      {/* Educational 404 Scene Illustration with Blob background */}
      <div className="relative flex items-center justify-center w-full max-w-[280px] sm:max-w-xs overflow-hidden">
        <NotFoundIllustration className="w-full h-auto" />
      </div>

      {/* Main Title & Message with verified High Contrast Dark Mode Classes */}
      <div className="space-y-1.5 max-w-md px-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Action Buttons */}
      {onGoHome && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            الرجوع للصفحة الرئيسية
          </button>
        </div>
      )}
    </div>
  )
}
