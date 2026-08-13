import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateEnrollmentDto } from '../enrollments/dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../enrollments/dto/update-enrollment.dto';
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

  @Get('community/summary')
  getCommunitySummary(@Req() request: AuthenticatedRequest) {
    return this.studentService.getCommunitySummary(
      this.requireStudentId(request),
    );
  }

  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  async enroll(
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentService.enroll(user.id, dto.courseId);
  }

  @Get('enrollments/:enrollmentId')
  async getEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentService.getEnrollment(enrollmentId, user.id);
  }

  @Patch('enrollments/:enrollmentId')
  async updateEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentService.updateEnrollment(
      enrollmentId,
      user.id,
      dto.status,
    );
  }

  @Delete('enrollments/:enrollmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unenroll(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.studentService.unenroll(enrollmentId, user.id);
  }

  private requireStudentId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new Error(
        'AuthGuard has not attached an authenticated user to the request yet.',
      );
    }
    return request.user.id;
  }
}
