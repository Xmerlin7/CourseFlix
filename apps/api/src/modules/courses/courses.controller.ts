import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('api/v1/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get(':courseId')
  getCourseDetail(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseDetail(courseId);
  }
}
