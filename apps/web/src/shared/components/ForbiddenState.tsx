import { ArrowLeft } from 'lucide-react'
import { ForbiddenIllustration } from './illustrations/ForbiddenIllustration'

type ForbiddenStateProps = {
  title?: string
  message?: string
  onGoBack?: () => void
}

export function ForbiddenState({
  title = 'غير مسموح لك بالوصول',
  message = 'ليس لديك الصلاحية الكافية لعرض هذه الصفحة',
  onGoBack,
}: ForbiddenStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center min-h-[60vh]"
      role="alert"
    >
      {/* Illustration */}
      <ForbiddenIllustration className="w-80 max-w-full h-auto" />

      {/* Text content */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Back button */}
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="mt-4 flex items-center gap-2 px-7 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.97] transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          الرجوع للصفحة الرئيسية
        </button>
      )}
    </div>
  )
}