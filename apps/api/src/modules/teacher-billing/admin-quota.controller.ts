import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TopUpQuotaDto } from './dto/top-up-quota.dto';
import { TeacherBillingService } from './teacher-billing.service';

/** Admin surface for every teacher's quota — the "charge the teacher" control. */
@Controller('api/v1/admin/quotas')
@UseGuards(AuthGuard, AdminRoleGuard)
export class AdminQuotaController {
  constructor(private readonly teacherBillingService: TeacherBillingService) {}

  @Get()
  listQuotas() {
    return this.teacherBillingService.listQuotas();
  }

  @Post(':teacherId/top-up')
  topUp(@Param('teacherId') teacherId: string, @Body() dto: TopUpQuotaDto) {
    return this.teacherBillingService.topUp(teacherId, dto.credits);
  }
}
