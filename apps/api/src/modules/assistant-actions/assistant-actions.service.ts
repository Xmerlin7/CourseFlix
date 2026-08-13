import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssistantActionEntity } from './entities/assistant-action.entity';
import {
  findActionDefinition,
  type ReplayDeps,
} from './assistant-action.registry';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../users/entities/user.entity';

export interface ParkInput {
  assistantId: string;
  assistantName: string;
  teacherId: string;
  routeKey: string;
  params: Record<string, string>;
  body: Record<string, unknown>;
  summary: string;
}

/** What the client gets back — never the raw params/body. */
export interface AssistantActionResponse {
  id: string;
  summary: string;
  status: string;
  assistantId: string;
  assistantName: string;
  reviewNote: string | null;
  executionError: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

/** The 202 body a parked write answers with. */
export interface PendingApprovalResponse {
  pendingApproval: true;
  action: AssistantActionResponse;
  message: string;
}

@Injectable()
export class AssistantActionsService {
  private readonly logger = new Logger(AssistantActionsService.name);

  /**
   * Replay targets are injected lazily via `setReplayDeps` rather than
   * through the constructor. TeacherService and QuizzesService both sit
   * downstream of the interceptor that needs this service, so taking them
   * as constructor dependencies closes a cycle Nest cannot resolve even
   * with forwardRef on every edge.
   */
  private replayDeps: ReplayDeps | null = null;

  constructor(
    @InjectRepository(AssistantActionEntity)
    private readonly actionsRepository: Repository<AssistantActionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  setReplayDeps(deps: ReplayDeps): void {
    this.replayDeps = deps;
  }

  /** Records a write instead of running it, and tells the teacher. */
  async park(input: ParkInput): Promise<PendingApprovalResponse> {
    const action = await this.actionsRepository.save(
      this.actionsRepository.create({
        assistantId: input.assistantId,
        teacherId: input.teacherId,
        routeKey: input.routeKey,
        params: input.params,
        body: input.body,
        summary: input.summary,
        status: 'pending',
      }),
    );

    await this.notifications.notify({
      userId: input.teacherId,
      type: 'system',
      title: 'إجراء بانتظار موافقتك',
      message: `${input.assistantName}: ${input.summary}`,
      relatedEntityType: 'assistant_action',
      relatedEntityId: action.id,
    });

    return {
      pendingApproval: true,
      action: await this.toResponse(action, input.assistantName),
      message: 'تم إرسال طلبك للمعلم — سيُنفَّذ بعد موافقته.',
    };
  }

  /** The teacher's review queue, or the assistant's own submissions. */
  async list(
    scope: { teacherId: string } | { assistantId: string },
    status?: string,
  ): Promise<AssistantActionResponse[]> {
    const qb = this.actionsRepository
      .createQueryBuilder('action')
      .orderBy('action.created_at', 'DESC')
      .take(200);

    if ('teacherId' in scope) {
      qb.where('action.teacher_id = :id', { id: scope.teacherId });
    } else {
      qb.where('action.assistant_id = :id', { id: scope.assistantId });
    }
    if (status && status !== 'all') {
      qb.andWhere('action.status = :status', { status });
    }

    const actions = await qb.getMany();
    return this.toResponses(actions);
  }

  async countPendingForTeacher(teacherId: string): Promise<number> {
    return this.actionsRepository.count({
      where: { teacherId, status: 'pending' },
    });
  }

  /**
   * Approves and immediately replays the action.
   *
   * A replay failure does not roll the approval back: the teacher did
   * decide, and re-showing the row as pending would invite them to
   * approve it again. The failure is recorded on the row and surfaced to
   * both of them instead.
   */
  async approve(
    actionId: string,
    teacherId: string,
  ): Promise<AssistantActionResponse> {
    const action = await this.loadPending(actionId, teacherId);
    const definition = findActionDefinition(action.routeKey);
    if (!definition) {
      throw new ConflictException(
        'هذا الإجراء لم يعد مدعومًا ولا يمكن تنفيذه.',
      );
    }
    if (!this.replayDeps) {
      throw new ConflictException('تعذر تنفيذ الإجراء الآن، حاول مرة أخرى.');
    }

    action.status = 'approved';
    action.reviewedBy = teacherId;
    action.reviewedAt = new Date();

    try {
      await definition.run(this.replayDeps, {
        params: action.params,
        body: action.body,
        teacherId,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'خطأ غير معروف';
      action.executionError = reason;
      this.logger.error(
        `Replay of assistant action ${action.id} (${action.routeKey}) failed: ${reason}`,
      );
    }

    await this.actionsRepository.save(action);

    await this.notifications.notify({
      userId: action.assistantId,
      type: 'system',
      title: action.executionError
        ? 'تمت الموافقة لكن التنفيذ فشل'
        : 'تمت الموافقة على إجراءك',
      message: action.executionError
        ? `${action.summary} — وافق المعلم لكن تعذر التنفيذ: ${action.executionError}`
        : `${action.summary} — تم التنفيذ بنجاح.`,
      relatedEntityType: 'assistant_action',
      relatedEntityId: action.id,
    });

    return (await this.toResponses([action]))[0];
  }

  async reject(
    actionId: string,
    teacherId: string,
    note?: string,
  ): Promise<AssistantActionResponse> {
    const action = await this.loadPending(actionId, teacherId);

    action.status = 'rejected';
    action.reviewedBy = teacherId;
    action.reviewedAt = new Date();
    action.reviewNote = note?.trim() || null;
    await this.actionsRepository.save(action);

    await this.notifications.notify({
      userId: action.assistantId,
      type: 'system',
      title: 'تم رفض إجراءك',
      message: action.reviewNote
        ? `${action.summary} — السبب: ${action.reviewNote}`
        : `${action.summary} — رفض المعلم هذا الإجراء.`,
      relatedEntityType: 'assistant_action',
      relatedEntityId: action.id,
    });

    return (await this.toResponses([action]))[0];
  }

  private async loadPending(
    actionId: string,
    teacherId: string,
  ): Promise<AssistantActionEntity> {
    const action = await this.actionsRepository.findOne({
      where: { id: actionId, teacherId },
    });
    if (!action) {
      throw new NotFoundException('الإجراء غير موجود.');
    }
    if (action.status !== 'pending') {
      throw new ConflictException('تمت مراجعة هذا الإجراء بالفعل.');
    }
    return action;
  }

  /** One name lookup for the whole page rather than one per row. */
  private async toResponses(
    actions: AssistantActionEntity[],
  ): Promise<AssistantActionResponse[]> {
    if (actions.length === 0) return [];

    const ids = [...new Set(actions.map((action) => action.assistantId))];
    const users = await this.usersRepository.find({
      where: ids.map((id) => ({ id })),
      select: { id: true, fullName: true },
    });
    const nameById = new Map(users.map((user) => [user.id, user.fullName]));

    return actions.map((action) => ({
      id: action.id,
      summary: action.summary,
      status: action.status,
      assistantId: action.assistantId,
      assistantName: nameById.get(action.assistantId) ?? 'مساعد',
      reviewNote: action.reviewNote,
      executionError: action.executionError,
      createdAt: action.createdAt.toISOString(),
      reviewedAt: action.reviewedAt?.toISOString() ?? null,
    }));
  }

  private async toResponse(
    action: AssistantActionEntity,
    assistantName: string,
  ): Promise<AssistantActionResponse> {
    return {
      id: action.id,
      summary: action.summary,
      status: action.status,
      assistantId: action.assistantId,
      assistantName,
      reviewNote: action.reviewNote,
      executionError: action.executionError,
      createdAt: action.createdAt.toISOString(),
      reviewedAt: null,
    };
  }
}
