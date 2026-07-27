import { useState } from 'react'
import { useParams } from 'react-router'
import { CourseDetailView } from '../../courses/components/CourseDetailView'
import { useCourseDetail } from '../../courses/hooks/useCourseDetail'
import { DocumentStatusList } from '../../documents/components/DocumentStatusList'
import { DocumentUploader } from '../../documents/components/DocumentUploader'
import { useCourseDocuments } from '../../documents/hooks/useCourseDocuments'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { TeacherCourseForm } from '../components/TeacherCourseForm'

type CourseDetailTab = 'content' | 'files'

export function TeacherCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { data, isLoading, error, refetch } = useCourseDetail(courseId ?? '')
  const documents = useCourseDocuments(courseId ?? '')
  const [activeTab, setActiveTab] = useState<CourseDetailTab>('content')

  if (isLoading) {
    return <LoadingState variant="text" />
  }

  if (error) {
    if (error.status === 403) {
      return <ForbiddenState />
    }
    if (error.status === 404) {
      return <NotFoundState />
    }
    return <ErrorState onRetry={refetch} />
  }

  if (!data) {
    return <NotFoundState />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700" role="tablist" dir="rtl">
        <button
          role="tab"
          aria-selected={activeTab === 'content'}
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'content'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          المحتوى
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'files'}
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'files'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          الملفات
        </button>
      </div>

      {activeTab === 'content' && (
        <>
          <CourseDetailView course={data} />

          {data.canEdit && (
            <TeacherCourseForm
              course={{
                id: data.id,
                title: data.title,
                description: data.description,
                coverImageUrl: data.coverImageUrl,
                gradeLevel: data.gradeLevel,
                status: data.status,
              }}
              onSaved={refetch}
            />
          )}
        </>
      )}

      {activeTab === 'files' && (
        <div className="flex flex-col gap-4">
          <DocumentUploader onUpload={documents.upload} />

          {documents.isLoading ? (
            <LoadingState variant="list" />
          ) : documents.error ? (
            <ErrorState onRetry={documents.refetch} />
          ) : (
            <DocumentStatusList documents={documents.data} onRetry={documents.retry} />
          )}
        </div>
      )}
    </div>
  )
}
