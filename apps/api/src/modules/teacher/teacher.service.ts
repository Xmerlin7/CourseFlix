import { Injectable } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class TeacherService {
  constructor(private readonly coursesService: CoursesService) {}

  getDashboard() {
    return {
      TODO: 'Build real owned-course statistics for the authenticated teacher.',
    };
  }

  getCourses() {
    return {
      TODO: 'Use authenticated teacher id and return owned course list only.',
      serviceLayer: this.coursesService.findOwnedCourses(
        'TODO-authenticated-teacher-id',
      ),
    };
  }

  updateCourse(courseId: string, updateCourseDto: UpdateCourseDto) {
    return {
      TODO: 'Validate allowed fields and persist metadata after owner check.',
      courseId,
      updateCourseDto,
      serviceLayer: this.coursesService.updateCourseMetadata(
        courseId,
        'TODO-authenticated-teacher-id',
      ),
    };
  }
}
