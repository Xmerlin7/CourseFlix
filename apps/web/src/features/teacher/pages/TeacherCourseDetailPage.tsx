import { useParams } from 'react-router'
import { CourseDetailView } from '../../courses/components/CourseDetailView'
import { useCourseDetail } from '../../courses/hooks/useCourseDetail'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { TeacherCourseForm } from '../components/TeacherCourseForm'

export function TeacherCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { data, isLoading, error, refetch } = useCourseDetail(courseId ?? '')

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
    </div>
  )
}
