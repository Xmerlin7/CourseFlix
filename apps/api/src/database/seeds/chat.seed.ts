import { DataSource, IsNull } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { EnrollmentEntity } from '../../modules/enrollments/entities/enrollment.entity';
import { ChatConversationEntity } from '../../modules/tutor/entities/chat-conversation.entity';
import { ChatMessageEntity } from '../../modules/tutor/entities/chat-message.entity';
import { ChatMessageSourceChunkEntity } from '../../modules/tutor/entities/chat-message-source-chunk.entity';
import { COURSE_CONTENT } from './content';

interface ChunkRow {
  id: string;
  page_number: number;
  text_preview: string;
}

/**
 * Seeds one Tutor conversation per enrolled (student, published course)
 * pair — a real question about the course's first lesson, and a real
 * grounded answer citing the course handout's actual `document_chunks`
 * (written by `course-handout.seed.ts`, which must run before this) — so
 * `GET courses/:courseId/tutor/messages` shows genuine history instead of
 * an empty first-visit state, and the citation UI has a real chunk to
 * point at.
 *
 * Must run after `seedCourseHandouts`: it reads the handout's chunk rows
 * rather than inventing citation ids, so a citation shown in seeded
 * history always resolves to a real page in a real PDF.
 *
 * Safe to run on every reseed: upserts by (studentId, courseId) — one
 * conversation per pair, matching `ChatConversationEntity`'s own
 * `idx_chat_conversations_student_course` index.
 */
export async function seedChatHistory(
  dataSource: DataSource,
): Promise<{ conversationsCreated: number; messagesCreated: number }> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const enrollmentRepository = dataSource.getRepository(EnrollmentEntity);
  const conversationRepository = dataSource.getRepository(
    ChatConversationEntity,
  );
  const messageRepository = dataSource.getRepository(ChatMessageEntity);
  const sourceChunkRepository = dataSource.getRepository(
    ChatMessageSourceChunkEntity,
  );

  let conversationsCreated = 0;
  let messagesCreated = 0;

  for (const courseContent of COURSE_CONTENT) {
    const course = await courseRepository.findOne({
      where: { slug: courseContent.slug },
    });
    if (!course || course.status !== 'published') continue;

    const firstLesson = courseContent.lessons[0];
    if (!firstLesson) continue;

    const chunkRows = await dataSource.query<ChunkRow[]>(
      `SELECT dc.id, dc.page_number, dc.text_preview
         FROM document_chunks dc
         JOIN documents d ON d.id = dc.document_id
        WHERE d.course_id = $1 AND d.file_name LIKE 'مذكرة %'
        ORDER BY dc.chunk_index ASC
        LIMIT 1`,
      [course.id],
    );
    const chunk = chunkRows[0];
    if (!chunk) continue; // handout not seeded yet — nothing to cite.

    // `EnrollmentEntity.deletedAt` is a plain column, not a
    // `@DeleteDateColumn` — must be filtered explicitly (see
    // `order.seed.ts`'s docblock for why this matters across resets).
    const enrollments = await enrollmentRepository.find({
      where: { courseId: course.id, deletedAt: IsNull() },
    });

    // One conversation per enrolled student keeps this proportional to
    // the class size instead of flooding chat_messages for large courses.
    for (const enrollment of enrollments.slice(0, 3)) {
      const existing = await conversationRepository.findOne({
        where: { studentId: enrollment.studentId, courseId: course.id },
      });
      if (existing) continue;

      const conversation = await conversationRepository.save(
        conversationRepository.create({
          studentId: enrollment.studentId,
          courseId: course.id,
          status: 'active',
        }),
      );
      conversationsCreated += 1;

      const question = `ممكن تشرحلي ${firstLesson.lesson}؟`;
      const studentMessage = await messageRepository.save(
        messageRepository.create({
          conversationId: conversation.id,
          senderType: 'student',
          role: 'user',
          messageText: question,
        }),
      );
      messagesCreated += 1;

      const answer = `${firstLesson.summary} ${firstLesson.workedExample}`;
      const assistantMessage = await messageRepository.save(
        messageRepository.create({
          conversationId: conversation.id,
          senderType: 'ai_tutor',
          role: 'assistant',
          messageText: answer,
          modelName: 'gpt-5.6',
          provider: 'openai',
          promptVersion: 'grounded-tutor-v1',
          tokensUsed: Math.ceil(answer.length / 3),
        }),
      );
      messagesCreated += 1;

      await sourceChunkRepository.save(
        sourceChunkRepository.create({
          messageId: assistantMessage.id,
          chunkId: chunk.id,
          relevanceScore: '0.9200',
          excerpt: chunk.text_preview.slice(0, 200),
          vectorId: null,
        }),
      );

      await conversationRepository.update(conversation.id, {
        lastMessageAt: assistantMessage.createdAt,
      });

      void studentMessage;
    }
  }

  return { conversationsCreated, messagesCreated };
}
