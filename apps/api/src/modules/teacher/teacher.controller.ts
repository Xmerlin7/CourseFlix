import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UpdateCourseDto } from './dto/update-course.dto';
import { TeacherService } from './teacher.service';

@Controller('api/v1/teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('dashboard')
  getDashboard() {
    return this.teacherService.getDashboard();
  }

  @Get('courses')
  getCourses() {
    return this.teacherService.getCourses();
  }

  @Patch('courses/:courseId')
  updateCourse(
    @Param('courseId') courseId: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.teacherService.updateCourse(courseId, updateCourseDto);
  }
}
