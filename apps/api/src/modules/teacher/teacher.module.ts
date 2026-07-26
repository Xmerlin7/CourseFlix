import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SessionsModule } from '../sessions/sessions.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  // SessionsModule is required directly here (not just transitively via
  // CoursesModule) for TeacherController's AuthGuard to resolve
  // SessionsService within this module's DI context (CF-BUG-001).
  imports: [CoursesModule, EnrollmentsModule, SessionsModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
