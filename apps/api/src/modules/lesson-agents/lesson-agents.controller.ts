import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { scopeTeacherId } from '../../common/utils/scope-teacher-id';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherOrAssistantRoleGuard } from '../auth/guards/teacher-or-assistant-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { StartLessonAgentRunDto } from './dto/start-lesson-agent-run.dto';
import { StepFeedbackDto } from './dto/step-feedback.dto';
import { UpdateAgentSettingsDto } from './dto/update-agent-settings.dto';
import { AGENT_ROSTER } from './lesson-agents.constants';
import { LessonAgentsService } from './lesson-agents.service';

/**
 * Teacher-surface API for the multi-agent lesson pipeline. Every route
 * is scoped through `scopeTeacherId`, so an assistant acts on the one
 * teacher they belong to rather than on themselves (they own no
 * courses, so `user.id` would silently 404).
 */
@Controller('api/v1')
@UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
export class LessonAgentsController {
  constructor(private readonly lessonAgentsService: LessonAgentsService) {}

  /**
   * Static roster, served so the settings form and the timeline render
   * the same names, roles and icons the backend seeds steps from —
   * rather than the web app keeping its own copy that can drift.
   */
  @Get('teacher/agents')
  listAgents() {
    return AGENT_ROSTER;
  }

  @Get('teacher/agent-settings')
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.lessonAgentsService.getSettings(scopeTeacherId(user));
  }

  @Patch('teacher/agent-settings')
  updateSettings(
    @Body() dto: UpdateAgentSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.updateSettings(scopeTeacherId(user), dto);
  }

  @Post('teacher/lessons/:lessonId/agent-runs')
  @HttpCode(HttpStatus.CREATED)
  startRun(
    @Param('lessonId') lessonId: string,
    @Body() dto: StartLessonAgentRunDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.startRun(
      lessonId,
      scopeTeacherId(user),
      dto,
    );
  }

  @Get('teacher/courses/:courseId/agent-runs')
  listForCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.listRunsForCourse(
      courseId,
      scopeTeacherId(user),
    );
  }

  @Get('teacher/agent-runs/:runId')
  getRun(
    @Param('runId') runId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.getRun(runId, scopeTeacherId(user));
  }

  @Post('teacher/agent-runs/:runId/steps/:stepId/approve')
  @HttpCode(HttpStatus.OK)
  approveStep(
    @Param('runId') runId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.approveStep(
      runId,
      stepId,
      scopeTeacherId(user),
    );
  }

  @Post('teacher/agent-runs/:runId/steps/:stepId/reject')
  @HttpCode(HttpStatus.OK)
  rejectStep(
    @Param('runId') runId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.rejectStep(
      runId,
      stepId,
      scopeTeacherId(user),
    );
  }

  @Post('teacher/agent-runs/:runId/steps/:stepId/feedback')
  @HttpCode(HttpStatus.OK)
  sendStepFeedback(
    @Param('runId') runId: string,
    @Param('stepId') stepId: string,
    @Body() dto: StepFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.sendStepFeedback(
      runId,
      stepId,
      scopeTeacherId(user),
      dto.message,
    );
  }

  @Post('teacher/agent-runs/:runId/publish')
  @HttpCode(HttpStatus.OK)
  publishRun(
    @Param('runId') runId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonAgentsService.publishRun(runId, scopeTeacherId(user));
  }
}
