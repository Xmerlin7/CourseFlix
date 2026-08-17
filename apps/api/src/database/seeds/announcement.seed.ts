import { DataSource } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { PostEntity } from '../../modules/announcements/entities/post.entity';

interface AnnouncementBlueprint {
  content: string;
  pinned: boolean;
}

/**
 * Two announcements per published course — one pinned welcome/orientation
 * post, one regular content-update post — so every course's "الإعلانات"
 * tab has real rows instead of the empty state, and `resolveNotificationTarget`
 * (`relatedEntityType: 'post'`) always has a real post to deep-link a
 * notification to.
 *
 * Safe to run on every reseed: upserts by (courseId, content).
 */
export async function seedAnnouncements(
  dataSource: DataSource,
  { teacherId }: { teacherId: string },
): Promise<number> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const postRepository = dataSource.getRepository(PostEntity);

  const courses = await courseRepository.find({
    where: { status: 'published' },
  });

  let created = 0;

  for (const course of courses) {
    const blueprints: AnnouncementBlueprint[] = [
      {
        content: `أهلاً بكل الطلاب المسجلين في دورة "${course.title}"! المحتوى كامل الآن: كل الدروس، الفيديوهات، والمذكرة الشاملة متاحة في تبويب الملفات. لو عندكم أي سؤال، اسألوا المساعد الذكي أو افتحوا نقاش جديد.`,
        pinned: true,
      },
      {
        content: `تم رفع اختبارات قصيرة على كل درس من دروس "${course.title}" — راجعوا تبويب الاختبارات وحلوها بعد مشاهدة كل فيديو لتثبيت المعلومة.`,
        pinned: false,
      },
    ];

    for (const blueprint of blueprints) {
      const existing = await postRepository.findOne({
        where: { courseId: course.id, content: blueprint.content },
      });
      if (existing) continue;

      await postRepository.save(
        postRepository.create({
          courseId: course.id,
          teacherId,
          content: blueprint.content,
          pinnedAt: blueprint.pinned ? new Date() : null,
        }),
      );
      created += 1;
    }
  }

  return created;
}
