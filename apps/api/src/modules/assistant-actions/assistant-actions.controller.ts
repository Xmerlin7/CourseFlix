import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherOrAssistantRoleGuard } from '../auth/guards/teacher-or-assistant-role.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AssistantActionsService } from './assistant-actions.service';
import { ReviewActionDto } from './dto/review-action.dto';

/**
 * The review queue for parked assistant writes.
 *
 * Deliberately NOT decorated with PendingApprovalInterceptor: an
 * assistant reading their own submissions is a read, and the two write
 * routes are teacher-only. Parking the approve endpoint itself would need
 * an approval to approve an approval.
 */
@Controller('api/v1/teacher/assistant-actions')
@UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
export class AssistantActionsController {
  constructor(private readonly actions: AssistantActionsService) {}

  /**
   * A teacher sees everything awaiting them; an assistant sees only what
   * they themselves submitted. Same route, scoped by who is asking —
   * there is no id parameter to tamper with.
   */
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.actions.list(
      user.role === 'assistant'
        ? { assistantId: user.id }
        : { teacherId: user.id },
      status,
    );
  }

  /** Drives the sidebar badge. Zero for an assistant — they don't review. */
  @Get('pending-count')
  async pendingCount(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'assistant') {
      return { count: 0 };
    }
    return { count: await this.actions.countPendingForTeacher(user.id) };
  }

  @Post(':actionId/approve')
  @UseGuards(TeacherRoleGuard)
  approve(
    @Param('actionId') actionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.actions.approve(actionId, user.id);
  }

  @Post(':actionId/reject')
  @UseGuards(TeacherRoleGuard)
  reject(
    @Param('actionId') actionId: string,
    @Body() dto: ReviewActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.actions.reject(actionId, user.id, dto.note);
  }
}
