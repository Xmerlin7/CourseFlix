import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateCourseDto } from './dto/update-course.dto';
import { TeacherService } from './teacher.service';

@Controller('api/v1/teacher')
@UseGuards(AuthGuard, TeacherRoleGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getDashboard(user.id);
  }

  @Get('courses')
  getCourses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.teacherService.getCourses(user.id, status);
  }

  @Patch('courses/:courseId')
  updateCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.teacherService.updateCourse(courseId, user.id, updateCourseDto);
  }
}
