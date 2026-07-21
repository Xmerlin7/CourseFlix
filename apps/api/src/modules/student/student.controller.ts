import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { StudentService } from './student.service';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Controller('api/v1/student')
@UseGuards(AuthGuard, StudentRoleGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('dashboard')
  getDashboard(@Req() request: AuthenticatedRequest) {
    return this.studentService.getDashboard(this.requireStudentId(request));
  }

  @Get('enrollments')
  getEnrollments(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('gradeLevel') gradeLevel?: string,
  ) {
    return this.studentService.getEnrollments(this.requireStudentId(request), {
      status,
      gradeLevel,
    });
  }

  /**
   * TODO(blocked on Albraa's AuthGuard): the guard currently always
   * returns true and never attaches `request.user`. This throws loudly
   * on purpose instead of silently falling back to a fake id — nothing
   * here "works" end-to-end until the real session wiring lands.
   */
  private requireStudentId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new Error(
        'AuthGuard has not attached an authenticated user to the request yet.',
      );
    }
    return request.user.id;
  }
}