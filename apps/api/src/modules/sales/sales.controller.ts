import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SalesService } from './sales.service';

@Controller('api/v1/teacher/sales')
@UseGuards(AuthGuard, TeacherRoleGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.salesService.getSummary(user.id, { from, to });
  }
}
