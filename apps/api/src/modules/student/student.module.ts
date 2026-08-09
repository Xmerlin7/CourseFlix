import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { LessonsModule } from '../lessons/lessons.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  // SessionsModule is required here (not just AuthModule) because
  // AuthGuard's SessionsService dependency is resolved within whichever
  // module declares the controller that uses it (CF-BUG-001).
  imports: [
    EnrollmentsModule,
    CoursesModule,
    UsersModule,
    SessionsModule,
    LessonsModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
