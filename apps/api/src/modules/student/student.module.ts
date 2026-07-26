import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { UsersModule } from '../users/users.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  imports: [EnrollmentsModule, CoursesModule, UsersModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
