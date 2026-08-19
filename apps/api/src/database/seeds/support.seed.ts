import { DataSource } from 'typeorm';
import {
  SupportTicketEntity,
  SupportTicketCategory,
  SupportTicketStatus,
} from '../../modules/support/entities/support-ticket.entity';
import { SupportMessageEntity } from '../../modules/support/entities/support-message.entity';

interface TicketBlueprint {
  category: SupportTicketCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  staffReply: string | null;
  studentReply: string | null;
}

const TICKET_BLUEPRINTS: TicketBlueprint[] = [
  {
    category: 'technical',
    subject: 'الفيديو مش شغال في درس قانون كولوم',
    description:
      'بحاول أشغل فيديو درس "قانون كولوم" في دورة الكهرومغناطيسية ومش عايز يبدأ، جربت أكتر من متصفح.',
    status: 'resolved',
    staffReply:
      'تم التأكد من الفيديو وهو شغال دلوقتي، جرب تعمل تحديث للصفحة (Ctrl+Shift+R) لو المشكلة لسه موجودة قولنا.',
    studentReply: 'تمام جربت وشغال دلوقتي، شكراً!',
  },
  {
    category: 'payment',
    subject: 'الدفع اتخصم ولسه الدورة مش ظاهرة عندي',
    description:
      'دفعت اشتراك دورة الميكانيكا الكلاسيكية وفلوسي اتخصمت من البطاقة، بس الدورة لسه مش ظاهرة في صفحة "دوراتي".',
    status: 'in_progress',
    staffReply:
      'شكراً للتواصل، بنراجع سجل الدفع دلوقتي مع فريق المدفوعات وهنرد عليك خلال ساعات.',
    studentReply: null,
  },
  {
    category: 'course',
    subject: 'محتاج مساعدة في فهم مسائل الشغل والطاقة',
    description:
      'حليت الأمثلة في المذكرة بس واجهت صعوبة في مسألة حساب القدرة، ممكن شرح إضافي؟',
    status: 'waiting_for_student',
    staffReply:
      'ابعتلنا رقم الصفحة أو نص المسألة بالظبط عشان نقدر نساعدك بدقة أكتر.',
    studentReply: null,
  },
  {
    category: 'account',
    subject: 'عايز أغير الإيميل بتاع حسابي',
    description: 'عايز أربط حسابي بإيميل تاني، إزاي أقدر أعمل كده؟',
    status: 'closed',
    staffReply:
      'حالياً تغيير الإيميل بيتم من فريق الدعم مباشرة — ابعتلنا الإيميل الجديد على نفس المحادثة وهنحدثه من عندنا.',
    studentReply:
      'تم، الإيميل الجديد هو نفس الإيميل المسجل به هنا فعلاً، تم الحل شكراً.',
  },
  {
    category: 'other',
    subject: 'اقتراح: إضافة وضع ليلي للتطبيق',
    description:
      'هل ممكن تضيفوا وضع ليلي (Dark Mode) للموقع؟ بيكون مريح للعين وقت المذاكرة بالليل.',
    status: 'open',
    staffReply: null,
    studentReply: null,
  },
];

/**
 * Seeds a handful of support tickets across every category and status
 * (open / in_progress / waiting_for_student / resolved / closed), each
 * with a real message thread, so the student's "الدعم الفني" list, the
 * teacher/admin staff queue, and `relatedEntityType: 'support_ticket'`
 * notifications all have real rows to show and link to.
 *
 * Safe to run on every reseed: upserts by (studentId, subject).
 */
export async function seedSupportTickets(
  dataSource: DataSource,
  { teacherId, studentIds }: { teacherId: string; studentIds: string[] },
): Promise<{ ticketsCreated: number; messagesCreated: number }> {
  const ticketRepository = dataSource.getRepository(SupportTicketEntity);
  const messageRepository = dataSource.getRepository(SupportMessageEntity);

  let ticketsCreated = 0;
  let messagesCreated = 0;

  for (const [index, blueprint] of TICKET_BLUEPRINTS.entries()) {
    const studentId = studentIds[index % studentIds.length];
    if (!studentId) continue;

    const existing = await ticketRepository.findOne({
      where: { studentId, subject: blueprint.subject },
    });
    if (existing) continue;

    const isClosed =
      blueprint.status === 'resolved' || blueprint.status === 'closed';

    const ticket = await ticketRepository.save(
      ticketRepository.create({
        studentId,
        courseId: null,
        category: blueprint.category,
        subject: blueprint.subject,
        description: blueprint.description,
        status: blueprint.status,
        assignedTo: blueprint.staffReply ? teacherId : null,
        resolvedAt: isClosed ? new Date() : null,
        closedAt: blueprint.status === 'closed' ? new Date() : null,
      }),
    );
    ticketsCreated += 1;

    await messageRepository.save(
      messageRepository.create({
        ticketId: ticket.id,
        authorId: studentId,
        isStaffReply: false,
        body: blueprint.description,
      }),
    );
    messagesCreated += 1;

    if (blueprint.staffReply) {
      await messageRepository.save(
        messageRepository.create({
          ticketId: ticket.id,
          authorId: teacherId,
          isStaffReply: true,
          body: blueprint.staffReply,
        }),
      );
      messagesCreated += 1;
    }

    if (blueprint.studentReply) {
      await messageRepository.save(
        messageRepository.create({
          ticketId: ticket.id,
          authorId: studentId,
          isStaffReply: false,
          body: blueprint.studentReply,
        }),
      );
      messagesCreated += 1;
    }
  }

  return { ticketsCreated, messagesCreated };
}
