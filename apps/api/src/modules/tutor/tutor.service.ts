import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  INTERVENTION_EVALUATOR_PORT,
  InterventionEvaluatorPort,
} from '../../common/ports/intervention-evaluator.port';
import {
  RETRIEVAL_PORT,
  RetrievedChunk,
  RetrievalPort,
} from '../../common/ports/retrieval.port';
import { DocumentEntity } from '../documents/entities/document.entity';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CREDIT_COSTS } from '../teacher-billing/teacher-billing.constants';
import { TeacherBillingService } from '../teacher-billing/teacher-billing.service';
import {
  LLM_PROVIDER,
  LlmGenerateResult,
  LlmProvider,
} from './adapters/llm.adapter';
import { ConversationsService } from './conversations.service';
import {
  buildGroundedTutorPrompt,
  GROUNDED_TUTOR_PROMPT_VERSION,
} from './prompt/grounded-prompt.template';
import { AnswerPolicyService } from './prompt/answer-policy.service';

export interface TutorCitation {
  documentId: string;
  documentName: string;
  page: number;
  excerpt: string;
}

export interface TutorMessageResponse {
  messageId: string;
  status: 'answered' | 'no_answer';
  answer: string;
  citations: TutorCitation[];
}

export interface TutorHistoryMessage {
  id: string;
  role: 'student' | 'assistant';
  text: string;
  createdAt: string;
}

const NO_ANSWER_MESSAGE = 'المواد المرفوعة لا تغطي هذا السؤال بعد.';
const ASSISTANT_IDENTITY_MESSAGE =
  'أنا سيف، مساعدك الذكي في CourseFlix. أقدر أساعدك في شرح وتلخيص مواد الدورة المرفوعة، توضيح النقاط الصعبة، الإجابة عن أسئلة الدروس، وتجهيز مراجعة سريعة من محتوى الكورس. اسألني عن أي جزء في ملفات الدورة وسأجاوبك بالمصادر المتاحة.';
const OUT_OF_SCOPE_MESSAGE =
  'أنا سيف، مساعدك الذكي لمحتوى هذه الدورة فقط. لا أستطيع الإجابة عن أسئلة خارج المواد المرفوعة هنا، لكن اسألني عن درس أو ملف في الكورس وسأساعدك بالمصادر.';
const COURSE_MATERIALS_GUIDANCE_MESSAGE =
  'أقدر أساعدك في شرح وتلخيص المذكرة والمواد المرفوعة مع هذه الدورة، والإجابة عن أسئلة الدروس بالمصادر المتاحة. لو عايز تعرف المحتوى، اسألني عن جزء محدد مثل: "لخص درس الكثافة"، "اشرح قانون نيوتن"، أو "طلعلي أهم النقاط في الفصل".';

const IDENTITY_PATTERNS = [
  /\b(hi|hello|hey)\b/i,
  /السلام عليكم|مرحبا|أهلا|أهلاً|اهلا|هاي/i,
  /مين\s+انت|من\s+انت|اسمك|تعرف\s+نفسك/i,
  /تقدر\s+تساعد|تساعدني\s+ازاي|تساعدني\s+إزاي|تعمل\s+ايه|تعمل\s+إيه|what can you do|who are you/i,
];

const COURSE_MATERIALS_GUIDANCE_PATTERNS = [
  /ايه\s+(هي\s+)?مواد\s+الدورة/,
  /إيه\s+(هي\s+)?مواد\s+الدورة/,
  /ما\s+(هي|هى)\s+مواد\s+الدورة/,
  /المواد\s+(المرفوعة|الموجودة|بتاعت\s+الدورة)/,
  /المذكرة\s+(المرفوعة|بتاعت\s+الدورة|الموجودة)/,
  /اسألك\s+عن\s+ايه/,
  /أسألك\s+عن\s+إيه/,
  /اسأل\s+ازاي/,
  /أسأل\s+إزاي/,
  /ابدأ\s+ازاي/,
  /تساعدني\s+في\s+ايه/,
  /تساعدني\s+في\s+إيه/,
  /course\s+materials/i,
  /uploaded\s+(materials|documents|files)/i,
];

const STUDY_PLAN_GUIDANCE_PATTERNS = [
  /خطة\s+(مذاكرة|للمذاكرة)/,
  /جدول\s+(مذاكرة|للمذاكرة)/,
  /جدول\s+.*(اسبوع|أسبوع|اسبوعين|أسبوعين|شهر)/,
  /اذاكر\s+ازاي/,
  /أذاكر\s+إزاي/,
  /خليها\s+(اسبوع|أسبوع|اسبوعين|أسبوعين|شهر)/,
  /خلّيها\s+(اسبوع|أسبوع|اسبوعين|أسبوعين|شهر)/,
  /خلي\s+.*في\s+(اسبوع|أسبوع|اسبوعين|أسبوعين|يوم|شهر)/,
  /خلّي\s+.*في\s+(اسبوع|أسبوع|اسبوعين|أسبوعين|يوم|شهر)/,
  /اخلص\s+.*في\s+(اسبوع|أسبوع|اسبوعين|أسبوعين|يوم|شهر)/,
  /أخلص\s+.*في\s+(اسبوع|أسبوع|اسبوعين|أسبوعين|يوم|شهر)/,
  /عايز\s+اخلص/,
  /عايز\s+أخلص/,
  /الم\s+المنهج/,
  /ألم\s+المنهج/,
  /study\s+plan/i,
  /schedule/i,
  /finish.*(week|month|days?)/i,
];

const TWO_WEEK_STUDY_PLAN_PATTERNS = [
  /اسبوعين/,
  /أسبوعين/,
  /two\s+weeks/i,
  /2\s+weeks/i,
];

const MONTH_STUDY_PLAN_PATTERNS = [/شهر/, /month/i, /30\s+days/i];

const BROAD_EXPLAIN_GUIDANCE_PATTERNS = [
  /اشرح(لي|لى)?\s+(الدورة|الكورس|المادة|الدرس)(\s+(دا|ده|كله))*\s*$/i,
  /لخص(لي|لى)?\s+(الدورة|الكورس|المادة|الدرس)(\s+(دا|ده|كله))*\s*$/i,
  /شرح\s+(الدورة|الكورس|المادة|الدرس)(\s+كله)?\s*$/i,
  /تلخيص\s+(الدورة|الكورس|المادة|الدرس)(\s+كله)?\s*$/i,
];

const EXPLICIT_OUT_OF_SCOPE_PATTERNS = [
  /نكتة|هزار|ضحكني|joke/i,
  /الطقس|weather/i,
  /الأخبار|الاخبار|news/i,
  /رئيس|انتخابات|سياسة|politics|president/i,
  /طبخة|وصفة|recipe/i,
  /اكتب\s+(كود|code)|برمج|programming/i,
  /تشخيص|علاج|دواء|medical|diagnose/i,
  /محامي|قانوني|legal/i,
];

type TutorDirectIntent =
  | 'identity'
  | 'materials_guidance'
  | 'study_plan_guidance'
  | 'broad_explain_guidance'
  | 'out_of_scope'
  | null;

function getDirectTutorIntent(question: string): TutorDirectIntent {
  if (IDENTITY_PATTERNS.some((pattern) => pattern.test(question))) {
    return 'identity';
  }

  if (
    COURSE_MATERIALS_GUIDANCE_PATTERNS.some((pattern) => pattern.test(question))
  ) {
    return 'materials_guidance';
  }

  if (STUDY_PLAN_GUIDANCE_PATTERNS.some((pattern) => pattern.test(question))) {
    return 'study_plan_guidance';
  }

  if (
    BROAD_EXPLAIN_GUIDANCE_PATTERNS.some((pattern) => pattern.test(question))
  ) {
    return 'broad_explain_guidance';
  }

  if (
    EXPLICIT_OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(question))
  ) {
    return 'out_of_scope';
  }

  return null;
}

function isExplainOrSummaryQuestion(question: string): boolean {
  return /(اشرح|اشرحلي|اشرحلى|شرح|لخص|لخصلي|لخصلى|تلخيص|explain|summari[sz]e)/i.test(
    question,
  );
}

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);

  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly conversationsService: ConversationsService,
    private readonly answerPolicyService: AnswerPolicyService,
    @Inject(RETRIEVAL_PORT)
    private readonly retrievalPort: RetrievalPort,
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    @Inject(INTERVENTION_EVALUATOR_PORT)
    private readonly interventionEvaluator: InterventionEvaluatorPort,
    private readonly teacherBillingService: TeacherBillingService,
  ) {}

  async sendMessage(input: {
    courseId: string;
    studentId: string;
    message: string;
  }): Promise<TutorMessageResponse> {
    const question = input.message.trim();
    if (!question) {
      throw new BadRequestException('Message cannot be empty.');
    }

    await this.enrollmentsService.assertStudentEnrolled(
      input.studentId,
      input.courseId,
    );

    const conversation =
      await this.conversationsService.getOrCreateActiveConversation(
        input.studentId,
        input.courseId,
      );

    // Gathered before saving the current message, so a repeated-question
    // check never matches the message against itself.
    const priorMessageTexts = (
      await this.conversationsService.listCourseMessages(
        input.studentId,
        input.courseId,
      )
    )
      .filter((message) => message.senderType === 'student')
      .map((message) => message.messageText);

    const studentMessage = await this.conversationsService.saveMessage({
      conversationId: conversation.id,
      senderType: 'student',
      role: 'user',
      messageText: question,
    });

    // Struggle-signal evaluation is a secondary side effect — it must
    // never fail or delay the primary Tutor response.
    this.interventionEvaluator
      .evaluateSignal({
        kind: 'chat_message',
        studentId: input.studentId,
        courseId: input.courseId,
        messageText: question,
        priorMessageTexts,
        evidenceRefId: studentMessage.id,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Intervention evaluation failed for message=${studentMessage.id}: ${String(error)}`,
        );
      });

    const directIntent = getDirectTutorIntent(question);
    if (directIntent === 'identity') {
      const assistantMessage = await this.persistDirectAnswer(
        conversation.id,
        ASSISTANT_IDENTITY_MESSAGE,
      );
      return {
        messageId: assistantMessage.id,
        status: 'answered',
        answer: ASSISTANT_IDENTITY_MESSAGE,
        citations: [],
      };
    }

    if (directIntent === 'materials_guidance') {
      const assistantMessage = await this.persistDirectAnswer(
        conversation.id,
        COURSE_MATERIALS_GUIDANCE_MESSAGE,
      );
      return {
        messageId: assistantMessage.id,
        status: 'answered',
        answer: COURSE_MATERIALS_GUIDANCE_MESSAGE,
        citations: [],
      };
    }

    if (directIntent === 'study_plan_guidance') {
      const llmResult = await this.buildStudyPlanGuidance(
        input.courseId,
        question,
      );
      const assistantMessage = await this.persistDirectAnswer(
        conversation.id,
        llmResult.answer,
        llmResult,
      );
      return {
        messageId: assistantMessage.id,
        status: 'answered',
        answer: llmResult.answer,
        citations: [],
      };
    }

    if (directIntent === 'broad_explain_guidance') {
      const llmResult = await this.buildBroadExplainGuidance(
        input.courseId,
        question,
      );
      const assistantMessage = await this.persistDirectAnswer(
        conversation.id,
        llmResult.answer,
        llmResult,
      );
      return {
        messageId: assistantMessage.id,
        status: 'answered',
        answer: llmResult.answer,
        citations: [],
      };
    }

    if (directIntent === 'out_of_scope') {
      const assistantMessage = await this.persistNoAnswer(
        conversation.id,
        OUT_OF_SCOPE_MESSAGE,
      );
      return {
        messageId: assistantMessage.id,
        status: 'no_answer',
        answer: OUT_OF_SCOPE_MESSAGE,
        citations: [],
      };
    }

    const retrievedChunks = await this.retrievalPort.search({
      courseId: input.courseId,
      query: question,
      topK: 5,
    });
    const relevantChunks =
      this.answerPolicyService.getRelevantChunks(retrievedChunks);

    if (relevantChunks.length === 0) {
      if (isExplainOrSummaryQuestion(question)) {
        const llmResult = await this.buildBroadExplainGuidance(
          input.courseId,
          question,
        );
        const assistantMessage = await this.persistDirectAnswer(
          conversation.id,
          llmResult.answer,
          llmResult,
        );
        return {
          messageId: assistantMessage.id,
          status: 'answered',
          answer: llmResult.answer,
          citations: [],
        };
      }

      const assistantMessage = await this.persistNoAnswer(conversation.id);
      this.logger.log(
        `Tutor no_answer trace: messageId=${assistantMessage.id} courseId=${input.courseId} chunks=${retrievedChunks.length}`,
      );
      return {
        messageId: assistantMessage.id,
        status: 'no_answer',
        answer: NO_ANSWER_MESSAGE,
        citations: [],
      };
    }

    const prompt = buildGroundedTutorPrompt({
      question,
      chunks: relevantChunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        page: chunk.page,
        excerpt: chunk.excerpt,
      })),
    });

    let llmResult: LlmGenerateResult;
    try {
      llmResult = await this.llmProvider.generateAnswer({
        prompt,
        question,
        chunks: relevantChunks,
      });
    } catch (error) {
      this.logger.warn(
        `Tutor provider failure courseId=${input.courseId} provider=${error instanceof Error ? error.name : 'unknown'}`,
      );
      throw new ServiceUnavailableException(
        'Tutor is temporarily unavailable. Please try again.',
      );
    }

    const citations = await this.buildValidatedCitations(
      llmResult.citedChunkIds,
      relevantChunks,
    );

    if (citations.length === 0) {
      const assistantMessage = await this.persistNoAnswer(
        conversation.id,
        NO_ANSWER_MESSAGE,
        llmResult,
      );
      this.logger.log(
        `Tutor downgraded to no_answer trace: messageId=${assistantMessage.id} courseId=${input.courseId}`,
      );
      return {
        messageId: assistantMessage.id,
        status: 'no_answer',
        answer: NO_ANSWER_MESSAGE,
        citations: [],
      };
    }

    const assistantMessage = await this.conversationsService.saveMessage({
      conversationId: conversation.id,
      senderType: 'ai_tutor',
      role: 'assistant',
      messageText: llmResult.answer,
      modelName: llmResult.modelName,
      provider: llmResult.provider,
      promptVersion: GROUNDED_TUTOR_PROMPT_VERSION,
      tokensUsed: llmResult.tokensUsed,
    });

    const chunksById = new Map(
      relevantChunks.map((chunk) => [chunk.chunkId, chunk]),
    );
    await this.conversationsService.saveSourceChunks(
      citations
        .map((citation) => chunksById.get(citation.chunkId))
        .filter((chunk): chunk is RetrievedChunk => Boolean(chunk))
        .map((chunk) => ({
          messageId: assistantMessage.id,
          chunkId: chunk.chunkId,
          relevanceScore: chunk.score,
          excerpt: chunk.excerpt,
          vectorId: chunk.vectorId,
        })),
    );

    this.logger.log(
      `Tutor answered trace: messageId=${assistantMessage.id} courseId=${input.courseId} citations=${citations.length} model=${llmResult.modelName}`,
    );

    await this.consumeTeacherTutorCredit(input.courseId);

    return {
      messageId: assistantMessage.id,
      status: 'answered',
      answer: llmResult.answer,
      citations: citations.map(
        ({ chunkId: _chunkId, ...citation }) => citation,
      ),
    };
  }

  async getCourseMessages(input: {
    courseId: string;
    studentId: string;
  }): Promise<TutorHistoryMessage[]> {
    await this.enrollmentsService.assertStudentEnrolled(
      input.studentId,
      input.courseId,
    );

    const messages = await this.conversationsService.listCourseMessages(
      input.studentId,
      input.courseId,
    );

    return messages.map((message) => ({
      id: message.id,
      role: message.senderType === 'student' ? 'student' : 'assistant',
      text: message.messageText,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  private async consumeTeacherTutorCredit(courseId: string): Promise<void> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    await this.teacherBillingService.consumeCredits(
      course.teacherId,
      CREDIT_COSTS.tutorMessage,
    );
  }

  private async buildStudyPlanGuidance(
    courseId: string,
    question: string,
  ): Promise<LlmGenerateResult> {
    const days = this.resolveStudyPlanDays(question);
    const lessons = await this.loadPublishedLessonTitles(courseId);
    const prompt = this.buildStudyPlanPrompt({ days, lessons });

    try {
      return await this.llmProvider.generateAnswer({
        prompt,
        question,
        chunks: [],
      });
    } catch (error) {
      this.logger.warn(
        `Tutor study-plan provider failure courseId=${courseId} provider=${error instanceof Error ? error.name : 'unknown'}`,
      );
      throw new ServiceUnavailableException(
        'Tutor is temporarily unavailable. Please try again.',
      );
    }
  }

  private async buildBroadExplainGuidance(
    courseId: string,
    question: string,
  ): Promise<LlmGenerateResult> {
    const lessons = await this.loadPublishedLessonTitles(courseId);
    const prompt = this.buildBroadExplainPrompt({ lessons });

    try {
      return await this.llmProvider.generateAnswer({
        prompt,
        question,
        chunks: [],
      });
    } catch (error) {
      this.logger.warn(
        `Tutor broad-explain provider failure courseId=${courseId} provider=${error instanceof Error ? error.name : 'unknown'}`,
      );
      throw new ServiceUnavailableException(
        'Tutor is temporarily unavailable. Please try again.',
      );
    }
  }

  private resolveStudyPlanDays(question: string): 7 | 14 | 30 {
    if (MONTH_STUDY_PLAN_PATTERNS.some((pattern) => pattern.test(question))) {
      return 30;
    }

    if (
      TWO_WEEK_STUDY_PLAN_PATTERNS.some((pattern) => pattern.test(question))
    ) {
      return 14;
    }

    return 7;
  }

  private async loadPublishedLessonTitles(courseId: string): Promise<string[]> {
    const course = await this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect(
        'course.sections',
        'section',
        "section.deleted_at IS NULL AND section.status = 'published'",
      )
      .leftJoinAndSelect(
        'section.lessons',
        'lesson',
        "lesson.deleted_at IS NULL AND lesson.status = 'published'",
      )
      .where('course.id = :courseId', { courseId })
      .andWhere('course.deleted_at IS NULL')
      .orderBy('section.order_index', 'ASC')
      .addOrderBy('lesson.order_index', 'ASC')
      .getOne();

    return (course?.sections ?? [])
      .flatMap((section) => section.lessons ?? [])
      .map((lesson) => lesson.title)
      .filter(Boolean);
  }

  private buildStudyPlanPrompt(input: {
    days: 7 | 14 | 30;
    lessons: string[];
  }): string {
    const durationLabel =
      input.days === 30 ? 'شهر' : input.days === 14 ? 'أسبوعين' : 'أسبوع';
    const lessonsText =
      input.lessons.length > 0
        ? input.lessons
            .map((lesson, index) => `${index + 1}. ${lesson}`)
            .join('\n')
        : 'لا توجد أسماء دروس منشورة متاحة. اكتب خطة عامة واطلب من الطالب إرسال اسم الجزء الذي يريد مراجعته.';

    return [
      'You are CourseFlix Arabic study coach.',
      `The student asked for a study plan for: ${durationLabel}.`,
      'Create a practical Arabic study plan using the lesson names below when available.',
      'Do not claim the plan is quoted from sources and do not include citations.',
      'Keep it concise enough for a small chat bubble.',
      'Use natural Egyptian-friendly Arabic.',
      'Mention that the student can ask for a summary, quiz, or explanation from the uploaded course materials after any lesson.',
      '',
      'Published lesson names:',
      lessonsText,
    ].join('\n');
  }

  private buildBroadExplainPrompt(input: { lessons: string[] }): string {
    const lessonsText =
      input.lessons.length > 0
        ? input.lessons
            .map((lesson, index) => `${index + 1}. ${lesson}`)
            .join('\n')
        : 'لا توجد أسماء دروس منشورة متاحة.';

    return [
      'You are CourseFlix Arabic study assistant.',
      'The student asked a broad request like explaining the whole lesson/course without naming a specific lesson or part.',
      'Reply in natural Egyptian-friendly Arabic.',
      'Do not say the uploaded materials do not cover the question.',
      'Ask the student to choose a specific lesson or part so you can explain it accurately from the uploaded course materials.',
      'If lesson names are available, mention a few useful options from the list.',
      'Keep the answer short and helpful for a small floating chat.',
      '',
      'Published lesson names:',
      lessonsText,
    ].join('\n');
  }

  private async persistNoAnswer(
    conversationId: string,
    messageText = NO_ANSWER_MESSAGE,
    llmResult?: LlmGenerateResult,
  ) {
    return this.conversationsService.saveMessage({
      conversationId,
      senderType: 'ai_tutor',
      role: 'assistant',
      messageText,
      modelName: llmResult?.modelName ?? null,
      provider: llmResult?.provider ?? null,
      promptVersion: GROUNDED_TUTOR_PROMPT_VERSION,
      tokensUsed: llmResult?.tokensUsed ?? null,
    });
  }

  private async persistDirectAnswer(
    conversationId: string,
    messageText: string,
    llmResult?: LlmGenerateResult,
  ) {
    return this.conversationsService.saveMessage({
      conversationId,
      senderType: 'ai_tutor',
      role: 'assistant',
      messageText,
      modelName: llmResult?.modelName ?? null,
      provider: llmResult?.provider ?? null,
      promptVersion: GROUNDED_TUTOR_PROMPT_VERSION,
      tokensUsed: llmResult?.tokensUsed ?? null,
    });
  }

  private async buildValidatedCitations(
    citedChunkIds: string[],
    relevantChunks: RetrievedChunk[],
  ): Promise<Array<TutorCitation & { chunkId: string }>> {
    const chunksById = new Map(
      relevantChunks.map((chunk) => [chunk.chunkId, chunk]),
    );
    const validChunks = Array.from(
      new Set(citedChunkIds.map((id) => chunksById.get(id)).filter(Boolean)),
    ) as RetrievedChunk[];

    if (validChunks.length === 0) {
      return [];
    }

    const documents = await this.documentsRepository.find({
      where: { id: In(validChunks.map((chunk) => chunk.documentId)) },
    });
    const documentNames = new Map(
      documents.map((document) => [document.id, document.fileName]),
    );

    return validChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      documentName: documentNames.get(chunk.documentId) ?? 'مستند الدورة',
      page: chunk.page,
      excerpt: chunk.excerpt,
    }));
  }
}
