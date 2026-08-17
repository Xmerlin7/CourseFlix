import { DataSource } from 'typeorm';
import {
  NotificationEntity,
  NotificationType,
} from '../../modules/notifications/entities/notification.entity';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { EnrollmentEntity } from '../../modules/enrollments/entities/enrollment.entity';

interface NotificationBlueprint {
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}

interface AnchorRow {
  id: string;
}

/**
 * Every notification's `relatedEntityType`/`relatedEntityId` must resolve
 * to a *real* row — `resolveNotificationTarget` (web) builds a click-through
 * link straight from those two columns with no existence check of its
 * own, so a fabricated id is a dead link the moment a user clicks it. This
 * seed therefore runs last (`seed-runner.ts`), after every other seed that
 * creates a course/thread/ticket/quiz/post/intervention/assistant_action,
 * and looks each anchor up for real before building the notification that
 * points at it. A blueprint whose anchor doesn't exist for that user is
 * skipped rather than seeded with a null id — better a shorter feed than
 * a notification that goes nowhere.
 *
 * Safe to run on every reseed: upserts by (userId, title).
 */
export async function seedNotifications(
  dataSource: DataSource,
  {
    teacherIds,
    assistantIds,
    studentIds,
  }: { teacherIds: string[]; assistantIds: string[]; studentIds: string[] },
): Promise<number> {
  const repository = dataSource.getRepository(NotificationEntity);
  const courseRepository = dataSource.getRepository(CourseEntity);
  const enrollmentRepository = dataSource.getRepository(EnrollmentEntity);

  const publishedCourses = await courseRepository.find({
    where: { status: 'published' },
  });
  const primaryCourse = publishedCourses[0];

  let created = 0;

  const upsert = async (
    userId: string,
    blueprint: NotificationBlueprint,
  ): Promise<void> => {
    const existing = await repository.findOne({
      where: { userId, title: blueprint.title },
    });
    if (existing) return;

    await repository.save(
      repository.create({
        userId,
        type: blueprint.type,
        title: blueprint.title,
        message: blueprint.message,
        isRead: blueprint.isRead,
        readAt: blueprint.isRead ? new Date() : null,
        relatedEntityType: blueprint.relatedEntityType,
        relatedEntityId: blueprint.relatedEntityId,
      }),
    );
    created += 1;
  };

  // ── Teachers ──────────────────────────────────────────────────────
  for (const teacherId of teacherIds) {
    const thread = primaryCourse
      ? (
          await dataSource.query<AnchorRow[]>(
            `SELECT id FROM discussion_threads WHERE course_id = $1 ORDER BY created_at ASC LIMIT 1`,
            [primaryCourse.id],
          )
        )[0]
      : undefined;

    const ticket = (
      await dataSource.query<AnchorRow[]>(
        `SELECT id FROM support_tickets WHERE assigned_to = $1 ORDER BY created_at ASC LIMIT 1`,
        [teacherId],
      )
    )[0];

    const assistantAction = (
      await dataSource.query<AnchorRow[]>(
        `SELECT id FROM assistant_actions WHERE teacher_id = $1 AND status = 'pending' ORDER BY created_at ASC LIMIT 1`,
        [teacherId],
      )
    )[0];

    const post = primaryCourse
      ? (
          await dataSource.query<AnchorRow[]>(
            `SELECT id FROM posts WHERE course_id = $1 ORDER BY created_at ASC LIMIT 1`,
            [primaryCourse.id],
          )
        )[0]
      : undefined;

    if (primaryCourse) {
      await upsert(teacherId, {
        type: 'course_update',
        title: 'طالب جديد انضم لدورتك',
        message: `انضم طالب جديد إلى دورة ${primaryCourse.title}`,
        isRead: true,
        relatedEntityType: 'course',
        relatedEntityId: primaryCourse.id,
      });
    }

    if (thread) {
      await upsert(teacherId, {
        type: 'discussion_reply',
        title: 'سؤال جديد من طالب',
        message: 'أحد الطلاب فتح نقاشاً جديداً يحتاج ردك في أحد دوراتك.',
        isRead: false,
        relatedEntityType: 'discussion_thread',
        relatedEntityId: thread.id,
      });
    }

    if (ticket) {
      await upsert(teacherId, {
        type: 'support_ticket_update',
        title: 'تذكرة دعم فني مسندة إليك',
        message: 'تم إسناد تذكرة دعم فني جديدة إليك، راجعها في أقرب وقت.',
        isRead: false,
        relatedEntityType: 'support_ticket',
        relatedEntityId: ticket.id,
      });
    }

    if (assistantAction) {
      await upsert(teacherId, {
        type: 'system',
        title: 'طلب مراجعة من المساعد',
        message: 'أحد مساعديك أضاف طلباً جديداً بانتظار موافقتك.',
        isRead: false,
        relatedEntityType: 'assistant_action',
        relatedEntityId: assistantAction.id,
      });
    }

    if (post) {
      await upsert(teacherId, {
        type: 'announcement',
        title: 'تم نشر إعلانك بنجاح',
        message: 'إعلانك في الدورة أصبح مرئياً لكل الطلاب المسجلين.',
        isRead: true,
        relatedEntityType: 'post',
        relatedEntityId: post.id,
      });
    }
  }

  // ── Assistants ────────────────────────────────────────────────────
  for (const assistantId of assistantIds) {
    const ownAction = (
      await dataSource.query<AnchorRow[]>(
        `SELECT id FROM assistant_actions WHERE assistant_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [assistantId],
      )
    )[0];

    if (ownAction) {
      await upsert(assistantId, {
        type: 'system',
        title: 'تحديث على طلبك',
        message: 'قام المعلم بمراجعة أحد الطلبات التي أرسلتها.',
        isRead: false,
        relatedEntityType: 'assistant_action',
        relatedEntityId: ownAction.id,
      });
    }

    if (primaryCourse) {
      await upsert(assistantId, {
        type: 'course_update',
        title: 'تحديث في محتوى الدورة',
        message: `تمت إضافة محتوى جديد إلى دورة ${primaryCourse.title}`,
        isRead: true,
        relatedEntityType: 'course',
        relatedEntityId: primaryCourse.id,
      });
    }
  }

  // ── Students ──────────────────────────────────────────────────────
  for (const studentId of studentIds) {
    const enrollment = await enrollmentRepository.findOne({
      where: { studentId },
    });
    const enrolledCourse = enrollment
      ? publishedCourses.find((course) => course.id === enrollment.courseId)
      : undefined;

    if (enrolledCourse) {
      await upsert(studentId, {
        type: 'course_update',
        title: 'محتوى جديد في دورتك',
        message: `تمت إضافة مذكرة ودروس جديدة إلى دورة ${enrolledCourse.title}`,
        isRead: false,
        relatedEntityType: 'course',
        relatedEntityId: enrolledCourse.id,
      });

      const quiz = (
        await dataSource.query<AnchorRow[]>(
          `SELECT id FROM quizzes WHERE course_id = $1 AND status = 'published' ORDER BY created_at ASC LIMIT 1`,
          [enrolledCourse.id],
        )
      )[0];
      if (quiz) {
        await upsert(studentId, {
          type: 'quiz_ready',
          title: 'اختبار جديد متاح',
          message: `أصبح اختبار جديد متاحًا الآن في دورة ${enrolledCourse.title}`,
          isRead: false,
          relatedEntityType: 'quiz',
          relatedEntityId: quiz.id,
        });
      }

      const post = (
        await dataSource.query<AnchorRow[]>(
          `SELECT id FROM posts WHERE course_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [enrolledCourse.id],
        )
      )[0];
      if (post) {
        await upsert(studentId, {
          type: 'announcement',
          title: 'إعلان جديد من معلمك',
          message: `نُشر إعلان جديد في دورة ${enrolledCourse.title}`,
          isRead: true,
          relatedEntityType: 'post',
          relatedEntityId: post.id,
        });
      }
    }

    const ownThread = (
      await dataSource.query<AnchorRow[]>(
        `SELECT id FROM discussion_threads WHERE author_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [studentId],
      )
    )[0];
    if (ownThread) {
      await upsert(studentId, {
        type: 'discussion_reply',
        title: 'رد جديد على نقاشك',
        message: 'قام المعلم بالرد على السؤال الذي فتحته في نقاشات الدورة.',
        isRead: false,
        relatedEntityType: 'discussion_thread',
        relatedEntityId: ownThread.id,
      });
    }

    const ownTicket = (
      await dataSource.query<AnchorRow[]>(
        `SELECT id FROM support_tickets WHERE student_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [studentId],
      )
    )[0];
    if (ownTicket) {
      await upsert(studentId, {
        type: 'support_ticket_update',
        title: 'تحديث على تذكرة الدعم الفني',
        message: 'هناك رد جديد على تذكرة الدعم الفني الخاصة بك.',
        isRead: false,
        relatedEntityType: 'support_ticket',
        relatedEntityId: ownTicket.id,
      });
    }

    const ownIntervention = (
      await dataSource.query<AnchorRow[]>(
        `SELECT id FROM interventions WHERE student_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [studentId],
      )
    )[0];
    if (ownIntervention) {
      await upsert(studentId, {
        type: 'progress_report',
        title: 'كويز مراجعة سريع لتقوية مفهوم',
        message: 'رصدنا مفهومًا يحتاج مراجعة إضافية، جهزنا لك كويز قصير عليه.',
        isRead: false,
        relatedEntityType: 'intervention',
        relatedEntityId: ownIntervention.id,
      });
    }

    await upsert(studentId, {
      type: 'system',
      title: 'تم تسجيل دخول جديد',
      message: 'تم تسجيل الدخول إلى حسابك من متصفح جديد.',
      isRead: true,
      relatedEntityType: null,
      relatedEntityId: null,
    });
  }

  return created;
}
