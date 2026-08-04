import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  AgentLogPort,
  AgentLogStatus,
  AgentType,
  RecordAgentLogInput,
} from '../../common/ports/agent-log.port';
import { getCorrelationId } from '../../common/correlation/correlation.context';
import { CoursesService } from '../courses/courses.service';
import { AgentLogEntity } from './entities/agent-log.entity';

export interface AgentLogResponse {
  id: string;
  agentType: AgentType;
  courseId: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  action: string;
  status: AgentLogStatus;
  tokensUsed: number | null;
  durationMs: number | null;
  rowCount: number | null;
  correlationId: string | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  executedAt: string;
}

export interface AgentLogListFilters {
  agentType?: string;
  status?: string;
  courseId?: string;
  from?: string;
  to?: string;
}

interface ParsedAgentLogListFilters {
  agentType?: AgentType;
  status?: AgentLogStatus;
  courseId?: string;
  from?: Date;
  to?: Date;
}

// Read-side hard cap — this is an operational log viewer for a Sprint 3
// demo, not a paginated export tool.
const MAX_RESULTS = 200;

const VALID_AGENT_TYPES: readonly AgentType[] = [
  'content_scout',
  'proactive_proctor',
  'tutor_llm',
  'analytics_agent',
];

const VALID_STATUSES: readonly AgentLogStatus[] = [
  'success',
  'failed',
  'retrying',
  'skipped',
];

function parseAgentTypeFilter(value?: string): AgentType | undefined {
  if (value === undefined) return undefined;
  if (!VALID_AGENT_TYPES.includes(value as AgentType)) {
    throw new BadRequestException(
      `Invalid agentType filter: "${value}". Must be one of ${VALID_AGENT_TYPES.join(', ')}.`,
    );
  }
  return value as AgentType;
}

function parseStatusFilter(value?: string): AgentLogStatus | undefined {
  if (value === undefined) return undefined;
  if (!VALID_STATUSES.includes(value as AgentLogStatus)) {
    throw new BadRequestException(
      `Invalid status filter: "${value}". Must be one of ${VALID_STATUSES.join(', ')}.`,
    );
  }
  return value as AgentLogStatus;
}

function parseDateFilter(label: string, value?: string): Date | undefined {
  if (value === undefined) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid ${label} filter: "${value}".`);
  }
  return parsed;
}

@Injectable()
export class AgentLogsService implements AgentLogPort {
  constructor(
    @InjectRepository(AgentLogEntity)
    private readonly agentLogsRepository: Repository<AgentLogEntity>,
    private readonly coursesService: CoursesService,
  ) {}

  // AgentLogPort implementation — called by the intervention rule
  // evaluator and (once wired) Nabile's Analytics Agent. Not exposed
  // over HTTP directly: there is no client-facing "create log" endpoint,
  // only the teacher-scoped read below.
  async record(input: RecordAgentLogInput): Promise<void> {
    await this.agentLogsRepository.save(
      this.agentLogsRepository.create({
        agentType: input.agentType,
        courseId: input.courseId ?? null,
        targetEntityType: input.targetEntityType ?? null,
        targetEntityId: input.targetEntityId ?? null,
        action: input.action,
        status: input.status,
        tokensUsed: input.tokensUsed ?? null,
        durationMs: input.durationMs ?? null,
        rowCount: input.rowCount ?? null,
        correlationId: input.correlationId ?? getCorrelationId() ?? null,
        metadata: input.metadata ?? null,
        errorMessage: input.errorMessage ?? null,
      }),
    );
  }

  // Scoped to courses the teacher owns — a teacher with zero owned
  // courses gets an empty list, never another teacher's rows.
  async listForTeacher(
    teacherId: string,
    filters: AgentLogListFilters = {},
  ): Promise<AgentLogResponse[]> {
    const parsed = this.parseFilters(filters);

    const ownedCourses = await this.coursesService.findOwnedCourses(teacherId);
    const ownedCourseIds = ownedCourses.map((course) => course.id);
    if (ownedCourseIds.length === 0) {
      return [];
    }

    if (parsed.courseId && !ownedCourseIds.includes(parsed.courseId)) {
      // Not "not found" — a teacher probing another teacher's courseId
      // gets the same empty result as any other unowned filter value.
      return [];
    }

    const where: FindOptionsWhere<AgentLogEntity> = {
      courseId: parsed.courseId ? parsed.courseId : In(ownedCourseIds),
    };
    if (parsed.agentType) {
      where.agentType = parsed.agentType;
    }
    if (parsed.status) {
      where.status = parsed.status;
    }
    if (parsed.from && parsed.to) {
      where.executedAt = Between(parsed.from, parsed.to);
    } else if (parsed.from) {
      where.executedAt = MoreThanOrEqual(parsed.from);
    } else if (parsed.to) {
      where.executedAt = LessThanOrEqual(parsed.to);
    }

    const logs = await this.agentLogsRepository.find({
      where,
      order: { executedAt: 'DESC' },
      take: MAX_RESULTS,
    });

    return logs.map((log) => this.toResponse(log));
  }

  private parseFilters(
    filters: AgentLogListFilters,
  ): ParsedAgentLogListFilters {
    return {
      agentType: parseAgentTypeFilter(filters.agentType),
      status: parseStatusFilter(filters.status),
      courseId: filters.courseId,
      from: parseDateFilter('from', filters.from),
      to: parseDateFilter('to', filters.to),
    };
  }

  private toResponse(log: AgentLogEntity): AgentLogResponse {
    return {
      id: log.id,
      agentType: log.agentType,
      courseId: log.courseId,
      targetEntityType: log.targetEntityType,
      targetEntityId: log.targetEntityId,
      action: log.action,
      status: log.status,
      tokensUsed: log.tokensUsed,
      durationMs: log.durationMs,
      rowCount: log.rowCount,
      correlationId: log.correlationId,
      metadata: log.metadata,
      errorMessage: log.errorMessage,
      executedAt: log.executedAt.toISOString(),
    };
  }
}
