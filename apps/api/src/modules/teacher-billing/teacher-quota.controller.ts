import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TeacherBillingService } from './teacher-billing.service';

/**
 * The teacher's own credit quota. Deliberately guarded with
 * TeacherRoleGuard (not TeacherOrAssistantRoleGuard): assistants are
 * never shown billing data — same policy as the sales surface.
 */
@Controller('api/v1/teacher/quota')
@UseGuards(AuthGuard, TeacherRoleGuard)
export class TeacherQuotaController {
  constructor(private readonly teacherBillingService: TeacherBillingService) {}

  @Get()
  getMyQuota(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherBillingService.getQuotaForTeacher(user.id);
  }
}
