import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [CoursesModule, EnrollmentsModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
