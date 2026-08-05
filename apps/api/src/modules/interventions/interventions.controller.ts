import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { InterventionsService } from './interventions.service';

@Controller('api/v1')
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Get('student/interventions')
  @UseGuards(AuthGuard, StudentRoleGuard)
  getStudentInterventions(@CurrentUser() user: AuthenticatedUser) {
    return this.interventionsService.listForStudent(user.id);
  }

  @Get('teacher/interventions')
  @UseGuards(AuthGuard, TeacherRoleGuard)
  getTeacherInterventions(@CurrentUser() user: AuthenticatedUser) {
    return this.interventionsService.listForTeacher(user.id);
  }
}
