import { DataSource } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { AssistantActionEntity } from '../../modules/assistant-actions/entities/assistant-action.entity';

interface AssistantActionBlueprint {
  summary: string;
  routeKey: string;
  params: Record<string, string>;
  body: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
}

/**
 * Seeds a few parked assistant writes across every review status
 * (pending / approved / rejected), so the teacher's Assistant Actions
 * queue (`/teacher/assistant-actions`) has real rows to approve or reject
 * from day one, and `relatedEntityType: 'assistant_action'` notifications
 * always resolve.
 *
 * Approved/rejected rows are seeded already-reviewed (not replayed
 * through the real registry) — they exist to populate the queue's history
 * view, not to actually mutate the course they reference.
 *
 * Safe to run on every reseed: upserts by (assistantId, summary).
 */
export async function seedAssistantActions(
  dataSource: DataSource,
  { teacherId, assistantIds }: { teacherId: string; assistantIds: string[] },
): Promise<number> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const actionRepository = dataSource.getRepository(AssistantActionEntity);

  if (assistantIds.length === 0) return 0;

  const course = await courseRepository.findOne({
    where: { slug: 'classical-mechanics' },
  });
  if (!course) return 0;

  const blueprints: AssistantActionBlueprint[] = [
    {
      summary: `تحديث وصف دورة "${course.title}" ليشمل تفاصيل أكثر عن المحتوى`,
      routeKey: 'PATCH /api/v1/teacher/courses/:courseId',
      params: { courseId: course.id },
      body: {
        description: `${course.description ?? ''} تشمل الدورة أيضاً أمثلة محلولة وفيديوهات مراجعة لكل درس.`,
      },
      status: 'pending',
      reviewNote: null,
    },
    {
      summary: `نشر إعلان ترحيبي جديد في دورة "${course.title}"`,
      routeKey: 'POST /api/v1/courses/:courseId/announcements',
      params: { courseId: course.id },
      body: {
        content: 'تم تحديث المذكرة الشاملة للدورة، راجعوها في تبويب الملفات.',
      },
      status: 'approved',
      reviewNote: 'موافق، إعلان مفيد.',
    },
    {
      summary: `تعديل الدرجة الدراسية المستهدفة لدورة "${course.title}"`,
      routeKey: 'PATCH /api/v1/teacher/courses/:courseId',
      params: { courseId: course.id },
      body: { gradeLevel: 'الصف الثالث الثانوي' },
      status: 'rejected',
      reviewNote: 'الدرجة الحالية صحيحة، لا داعي للتعديل.',
    },
  ];

  let created = 0;

  for (const [index, blueprint] of blueprints.entries()) {
    const assistantId = assistantIds[index % assistantIds.length];

    const existing = await actionRepository.findOne({
      where: { assistantId, summary: blueprint.summary },
    });
    if (existing) continue;

    const isReviewed = blueprint.status !== 'pending';

    await actionRepository.save(
      actionRepository.create({
        assistantId,
        teacherId,
        routeKey: blueprint.routeKey,
        params: blueprint.params,
        body: blueprint.body,
        summary: blueprint.summary,
        status: blueprint.status,
        reviewedBy: isReviewed ? teacherId : null,
        reviewedAt: isReviewed ? new Date() : null,
        reviewNote: blueprint.reviewNote,
      }),
    );
    created += 1;
  }

  return created;
}
