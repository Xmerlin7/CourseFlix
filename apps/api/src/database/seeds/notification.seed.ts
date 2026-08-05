import { DataSource } from 'typeorm';
import {
  NotificationEntity,
  NotificationType,
} from '../../modules/notifications/entities/notification.entity';

interface NotificationBlueprint {
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
}

const TEACHER_NOTIFICATIONS: NotificationBlueprint[] = [
  {
    type: 'course_update',
    title: 'تمت معالجة ملف بنجاح',
    message:
      'أصبح ملف "ملخص-قوانين-نيوتن.pdf" جاهزًا للبحث في دورة الميكانيكا الكلاسيكية',
    isRead: false,
  },
  {
    type: 'system',
    title: 'فشلت معالجة ملف',
    message:
      'تعذر استخراج النص من "ورقة-ممسوحة-ضوئيا.pdf" — يمكنك إعادة المحاولة من تبويب الملفات',
    isRead: false,
  },
  {
    type: 'progress_report',
    title: 'تقرير المتابعة الأسبوعي',
    message: 'سجّل 7 طلاب تقدمًا في دوراتك خلال الأسبوع الماضي',
    isRead: false,
  },
  {
    type: 'announcement',
    title: 'إعلان من المنصة',
    message: 'تم تفعيل المساعد الذكي على كل الدورات المنشورة',
    isRead: true,
  },
  {
    type: 'course_update',
    title: 'طالب جديد انضم لدورتك',
    message: 'انضمت مريم أحمد إلى دورة الكهرومغناطيسية',
    isRead: true,
  },
];

const STUDENT_NOTIFICATIONS: NotificationBlueprint[] = [
  {
    type: 'quiz_ready',
    title: 'اختبار جديد متاح',
    message:
      'أصبح اختبار "قوانين نيوتن للحركة" متاحًا الآن في دورة الميكانيكا الكلاسيكية',
    isRead: false,
  },
  {
    type: 'hw_assigned',
    title: 'واجب جديد',
    message:
      'تم تكليفك بواجب على قسم "الشغل والطاقة" — آخر موعد للتسليم بعد ثلاثة أيام',
    isRead: false,
  },
  {
    type: 'course_update',
    title: 'محتوى جديد في دورتك',
    message:
      'تمت إضافة درس "قانون حفظ كمية الحركة" إلى دورة الميكانيكا الكلاسيكية',
    isRead: false,
  },
  {
    type: 'progress_report',
    title: 'تقرير تقدمك',
    message: 'أنهيت 60% من دورة الميكانيكا الكلاسيكية — استمر!',
    isRead: true,
  },
  {
    type: 'announcement',
    title: 'إعلان من المنصة',
    message: 'أصبح بإمكانك سؤال المساعد الذكي عن أي درس داخل دوراتك',
    isRead: true,
  },
  {
    type: 'system',
    title: 'تم تسجيل دخول جديد',
    message: 'تم تسجيل الدخول إلى حسابك من متصفح جديد',
    isRead: true,
  },
];

/**
 * Seeds a notification feed for every seeded user, mixing read and unread
 * so the unread badge, the unread dot and the mark-read action all have
 * something to act on.
 *
 * Nothing in the app produces these yet — the ingestion worker that would
 * call `NotificationProducerPort.notify()` isn't built (see
 * docs/api/sprint2-notifications.md), so without this seed every
 * notifications page renders the empty state.
 *
 * Safe to run on every reseed: upserts by (userId, title).
 */
export async function seedNotifications(
  dataSource: DataSource,
  { teacherIds, studentIds }: { teacherIds: string[]; studentIds: string[] },
): Promise<number> {
  const repository = dataSource.getRepository(NotificationEntity);
  let created = 0;

  const targets: Array<{
    userIds: string[];
    blueprints: NotificationBlueprint[];
  }> = [
    { userIds: teacherIds, blueprints: TEACHER_NOTIFICATIONS },
    { userIds: studentIds, blueprints: STUDENT_NOTIFICATIONS },
  ];

  for (const { userIds, blueprints } of targets) {
    for (const userId of userIds) {
      for (const blueprint of blueprints) {
        const existing = await repository.findOne({
          where: { userId, title: blueprint.title },
        });
        if (existing) {
          continue;
        }

        await repository.save(
          repository.create({
            userId,
            type: blueprint.type,
            title: blueprint.title,
            message: blueprint.message,
            isRead: blueprint.isRead,
            readAt: blueprint.isRead ? new Date() : null,
          }),
        );
        created += 1;
      }
    }
  }

  return created;
}
