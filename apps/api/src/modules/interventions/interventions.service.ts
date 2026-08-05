import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  AGENT_LOG_PORT,
  AgentLogPort,
} from '../../common/ports/agent-log.port';
import {
  InterventionEvaluatorPort,
  InterventionSignal,
} from '../../common/ports/intervention-evaluator.port';
import {
  NOTIFICATION_PRODUCER_PORT,
  NotificationProducerPort,
} from '../../common/ports/notification-producer.port';
import { CoursesService } from '../courses/courses.service';
import { UserEntity } from '../users/entities/user.entity';
import { InterventionEvidenceEntity } from './entities/intervention-evidence.entity';
import {
  InterventionEntity,
  InterventionRuleKey,
} from './entities/intervention.entity';
import { ProgressReportEntity } from './entities/progress-report.entity';
import { MiniQuizService } from './mini-quiz.service';
import {
  evaluateChatMessage,
  evaluateLowQuizScore,
  INTERVENTION_RULE_VERSION,
  LOW_QUIZ_SCORE_THRESHOLD_PERCENT,
} from './rules/intervention-rules';

export interface StudentInterventionResponse {
  id: string;
  courseId: string;
  ruleKey: InterventionRuleKey;
  weakConcept: string;
  status: string;
  miniQuizId: string | null;
  createdAt: string;
}

export interface TeacherInterventionResponse extends StudentInterventionResponse {
  studentId: string;
  studentName: string;
  ruleVersion: number;
}

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class InterventionsService implements InterventionEvaluatorPort {
  private readonly logger = new Logger(InterventionsService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(InterventionEntity)
    private readonly interventionsRepository: Repository<InterventionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly coursesService: CoursesService,
    @Inject(NOTIFICATION_PRODUCER_PORT)
    private readonly notificationPort: NotificationProducerPort,
    @Inject(AGENT_LOG_PORT)
    private readonly agentLogPort: AgentLogPort,
    private readonly miniQuizService: MiniQuizService,
  ) {}

  // InterventionEvaluatorPort implementation — called by the quiz
  // submission flow and the Tutor chat flow. Never throws into the
  // caller: a signal that doesn't cross a threshold, or that duplicates
  // an already-active intervention, is a silent no-op, and a
  // notification/log delivery failure after the intervention is
  // committed is logged, not propagated (see the Promise.allSettled
  // block below).
  async evaluateSignal(signal: InterventionSignal): Promise<void> {
    const course = await this.coursesService.findCourseById(signal.courseId);
    if (!course) {
      return;
    }

    let ruleKey: InterventionRuleKey;
    let weakConcept: string;
    let evidenceType: string;
    let evidenceDetail: string;

    if (signal.kind === 'quiz_score') {
      if (!evaluateLowQuizScore(signal.scorePercent)) {
        return;
      }
      ruleKey = 'low_quiz_score';
      weakConcept = signal.weakConcept;
      evidenceType = 'quiz_submission';
      evidenceDetail = `نتيجة الاختبار ${Math.round(signal.scorePercent)}% أقل من الحد الأدنى ${LOW_QUIZ_SCORE_THRESHOLD_PERCENT}%.`;
    } else {
      const chatResult = evaluateChatMessage(
        signal.messageText,
        signal.priorMessageTexts,
      );
      if (!chatResult) {
        return;
      }
      ruleKey = chatResult.ruleKey;
      // No concept-tagging exists on chat messages today — the course
      // title is the safest deterministic label available (never the
      // raw question text, which stays out of every persisted field).
      weakConcept = course.title;
      evidenceType = 'chat_message';
      evidenceDetail = chatResult.evidenceDetail;
    }

    const dedupKey = this.buildDedupKey(
      signal.studentId,
      signal.courseId,
      ruleKey,
      weakConcept,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let intervention: InterventionEntity;
    try {
      intervention = await queryRunner.manager.save(InterventionEntity, {
        studentId: signal.studentId,
        courseId: signal.courseId,
        teacherId: course.teacherId,
        ruleKey,
        ruleVersion: INTERVENTION_RULE_VERSION,
        weakConcept,
        status: 'active',
        dedupKey,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (this.isUniqueViolation(error)) {
        // Duplicate signal in the same active window — no-op by design.
        return;
      }
      throw error;
    }

    try {
      await queryRunner.manager.save(ProgressReportEntity, {
        studentId: signal.studentId,
        courseId: signal.courseId,
        teacherId: course.teacherId,
        flaggedConcept: weakConcept,
        interventionId: intervention.id,
      });
      await queryRunner.manager.save(InterventionEvidenceEntity, {
        interventionId: intervention.id,
        evidenceType,
        evidenceRefId: signal.evidenceRefId,
        detail: evidenceDetail,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Nabile N-1: attach the deterministic mini-quiz. MiniQuizService
    // never throws (a quiz failure must not break the intervention).
    const miniQuizId =
      await this.miniQuizService.generateForIntervention(intervention);

    await this.notifyAndLog(
      intervention,
      course.teacherId,
      weakConcept,
      miniQuizId,
    );
  }

  async listForStudent(
    studentId: string,
  ): Promise<StudentInterventionResponse[]> {
    const interventions = await this.interventionsRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
    return interventions.map((intervention) =>
      this.toStudentResponse(intervention),
    );
  }

  // Scoped by the intervention's own stamped teacherId — set once at
  // creation from the owning course's teacherId, so this never needs a
  // second owned-courses lookup (and never drifts if a course changes
  // hands, matching how progress_reports.teacherId already works).
  async listForTeacher(
    teacherId: string,
  ): Promise<TeacherInterventionResponse[]> {
    const interventions = await this.interventionsRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
    });

    const studentIds = [
      ...new Set(interventions.map((intervention) => intervention.studentId)),
    ];
    const students = studentIds.length
      ? await this.usersRepository.find({ where: { id: In(studentIds) } })
      : [];
    const studentNameById = new Map(
      students.map((student) => [student.id, student.fullName]),
    );

    return interventions.map((intervention) =>
      this.toTeacherResponse(
        intervention,
        studentNameById.get(intervention.studentId) ?? 'طالب',
      ),
    );
  }

  private async notifyAndLog(
    intervention: InterventionEntity,
    teacherId: string,
    weakConcept: string,
    miniQuizId: string | null,
  ): Promise<void> {
    const studentNotification = miniQuizId
      ? {
          userId: intervention.studentId,
          type: 'quiz_ready',
          title: 'اختبار قصير جاهز للمراجعة',
          message: `يبدو إنك محتاج تراجع "${weakConcept}". افتح الاختبار القصير وراجع النقطة دي بسرعة.`,
          relatedEntityType: 'mini_quiz',
          relatedEntityId: miniQuizId,
        }
      : {
          userId: intervention.studentId,
          type: 'progress_report',
          title: 'تم رصد نقطة تحتاج مراجعة',
          message: `يبدو إنك محتاج تراجع "${weakConcept}"، هنجهزلك اختبار قصير.`,
          relatedEntityType: 'intervention',
          relatedEntityId: intervention.id,
        };

    const results = await Promise.allSettled([
      this.notificationPort.notify(studentNotification),
      this.notificationPort.notify({
        userId: teacherId,
        type: 'progress_report',
        title: 'تقرير تقدم جديد',
        message: `طالب محتاج متابعة في "${weakConcept}".`,
        relatedEntityType: 'intervention',
        relatedEntityId: intervention.id,
      }),
      this.agentLogPort.record({
        agentType: 'proactive_proctor',
        action: 'intervention.created',
        status: 'success',
        courseId: intervention.courseId,
        targetEntityType: 'intervention',
        targetEntityId: intervention.id,
        metadata: {
          ruleKey: intervention.ruleKey,
          ruleVersion: intervention.ruleVersion,
        },
      }),
    ]);

    results.forEach((result) => {
      if (result.status === 'rejected') {
        this.logger.warn(
          `Post-intervention side effect failed for intervention=${intervention.id}: ${String(result.reason)}`,
        );
      }
    });
  }

  private buildDedupKey(
    studentId: string,
    courseId: string,
    ruleKey: InterventionRuleKey,
    weakConcept: string,
  ): string {
    const normalizedConcept = weakConcept.trim().toLowerCase();
    return `${studentId}:${courseId}:${ruleKey}:${normalizedConcept}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }

  private toStudentResponse(
    intervention: InterventionEntity,
  ): StudentInterventionResponse {
    return {
      id: intervention.id,
      courseId: intervention.courseId,
      ruleKey: intervention.ruleKey,
      weakConcept: intervention.weakConcept,
      status: intervention.status,
      miniQuizId: intervention.miniQuizId,
      createdAt: intervention.createdAt.toISOString(),
    };
  }

  private toTeacherResponse(
    intervention: InterventionEntity,
    studentName: string,
  ): TeacherInterventionResponse {
    return {
      ...this.toStudentResponse(intervention),
      studentId: intervention.studentId,
      studentName,
      ruleVersion: intervention.ruleVersion,
    };
  }
}
