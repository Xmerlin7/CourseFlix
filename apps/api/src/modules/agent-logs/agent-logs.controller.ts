import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AgentLogsService } from './agent-logs.service';

@Controller('api/v1/teacher/agent-logs')
@UseGuards(AuthGuard, TeacherRoleGuard)
export class AgentLogsController {
  constructor(private readonly agentLogsService: AgentLogsService) {}

  @Get()
  getAgentLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('agentType') agentType?: string,
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.agentLogsService.listForTeacher(user.id, {
      agentType,
      status,
      courseId,
      from,
      to,
    });
  }
}
