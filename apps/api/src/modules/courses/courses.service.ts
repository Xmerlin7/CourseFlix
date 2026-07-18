import { Injectable } from '@nestjs/common';

@Injectable()
export class CoursesService {
  getCourseDetail(courseId: string) {
    return {
      TODO: 'Return ordered course sections/lessons after enrollment or owner permission check.',
      courseId,
    };
  }

  findOwnedCourses(teacherId: string) {
    return {
      TODO: 'Return courses owned by this teacher only.',
      teacherId,
    };
  }

  updateCourseMetadata(courseId: string, teacherId: string) {
    return {
      TODO: 'Patch allowed course metadata after verifying teacher ownership.',
      courseId,
      teacherId,
    };
  }
}
