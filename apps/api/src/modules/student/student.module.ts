import { Module } from '@nestjs/common';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { CoursesModule } from '../courses/courses.module';
import { DiscussionsModule } from '../discussions/discussions.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { LessonsModule } from '../lessons/lessons.module';
import { NotificationsModule } from '../notifications/notifications.module';
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
    DiscussionsModule,
    AnnouncementsModule,
    NotificationsModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
