import { DataSource, IsNull } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { EnrollmentEntity } from '../../modules/enrollments/entities/enrollment.entity';
import { DiscussionThreadEntity } from '../../modules/discussions/entities/discussion-thread.entity';
import { DiscussionReplyEntity } from '../../modules/discussions/entities/discussion-reply.entity';
import { DiscussionHelpfulVoteEntity } from '../../modules/discussions/entities/discussion-helpful-vote.entity';
import { COURSE_CONTENT } from './content';

/**
 * Seeds two student-started discussion threads per published course —
 * real questions about that course's actual first two lessons, each with
 * a teacher reply (one marked accepted) — so the Community tab has real
 * content everywhere and `relatedEntityType: 'discussion_thread'`
 * notifications always resolve to a thread that exists.
 *
 * Safe to run on every reseed: upserts by (courseId, authorId, title).
 */
export async function seedDiscussions(
  dataSource: DataSource,
  { teacherId, studentIds }: { teacherId: string; studentIds: string[] },
): Promise<{ threadsCreated: number; repliesCreated: number }> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const enrollmentRepository = dataSource.getRepository(EnrollmentEntity);
  const threadRepository = dataSource.getRepository(DiscussionThreadEntity);
  const replyRepository = dataSource.getRepository(DiscussionReplyEntity);
  const voteRepository = dataSource.getRepository(DiscussionHelpfulVoteEntity);

  let threadsCreated = 0;
  let repliesCreated = 0;

  for (const courseContent of COURSE_CONTENT) {
    const course = await courseRepository.findOne({
      where: { slug: courseContent.slug },
    });
    if (!course) continue;

    const enrolledStudentIds =
      // `EnrollmentEntity.deletedAt` is a plain column, not a
      // `@DeleteDateColumn` — must be filtered explicitly (see
      // `order.seed.ts`'s docblock for why this matters across resets).
      (
        await enrollmentRepository.find({
          where: { courseId: course.id, deletedAt: IsNull() },
        })
      ).map((enrollment) => enrollment.studentId);

    const authorPool =
      enrolledStudentIds.length > 0 ? enrolledStudentIds : studentIds;
    if (authorPool.length === 0) continue;

    const seedLessons = courseContent.lessons.slice(0, 2);

    for (const [index, lesson] of seedLessons.entries()) {
      const authorId = authorPool[index % authorPool.length];
      const title = `سؤال عن "${lesson.lesson}"`;

      let thread = await threadRepository.findOne({
        where: { courseId: course.id, authorId, title },
      });

      if (!thread) {
        thread = await threadRepository.save(
          threadRepository.create({
            courseId: course.id,
            authorId,
            authorRole: 'student',
            title,
            body: `مش فاهم بالظبط ${lesson.summary.split('.')[0]}. حد يقدر يبسطها أكتر أو يديني مثال إضافي؟`,
            tags: [course.gradeLevel ?? 'فيزياء'].filter(Boolean),
            replyCount: 0,
            helpfulCount: 0,
            isPinned: index === 0,
          }),
        );
        threadsCreated += 1;

        const teacherReply = await replyRepository.save(
          replyRepository.create({
            threadId: thread.id,
            authorId: teacherId,
            authorRole: 'teacher',
            body: `تمام، الفكرة ببساطة: ${lesson.workedExample}`,
            isAccepted: true,
          }),
        );
        repliesCreated += 1;

        await threadRepository.update(thread.id, {
          acceptedReplyId: teacherReply.id,
          replyCount: 1,
          helpfulCount: 1,
        });

        // A second student marks the teacher's reply helpful — gives the
        // helpful-count UI something real to show beyond zero/one.
        const secondStudentId = authorPool[(index + 1) % authorPool.length];
        if (secondStudentId && secondStudentId !== authorId) {
          const existingVote = await voteRepository.findOne({
            where: { threadId: thread.id, userId: secondStudentId },
          });
          if (!existingVote) {
            await voteRepository.save(
              voteRepository.create({
                threadId: thread.id,
                userId: secondStudentId,
              }),
            );
          }
        }
      }
    }
  }

  return { threadsCreated, repliesCreated };
}
