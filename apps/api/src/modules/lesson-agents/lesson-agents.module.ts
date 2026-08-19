import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { LessonEntity } from '../courses/entities/lesson.entity';
import { DocumentEntity } from '../documents/entities/document.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { JobsModule } from '../jobs/jobs.module';
import { VideoEntity } from '../lessons/entities/video.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuizEntity } from '../quizzes/entities/quiz.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { TeacherBillingModule } from '../teacher-billing/teacher-billing.module';
import { LessonAgentEventEntity } from './entities/lesson-agent-event.entity';
import { LessonAgentRunEntity } from './entities/lesson-agent-run.entity';
import { LessonAgentStepFeedbackEntity } from './entities/lesson-agent-step-feedback.entity';
import { LessonAgentStepEntity } from './entities/lesson-agent-step.entity';
import { TeacherAgentSettingsEntity } from './entities/teacher-agent-settings.entity';
import { LessonAgentsController } from './lesson-agents.controller';
import { LessonAgentsService } from './lesson-agents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonAgentRunEntity,
      LessonAgentStepEntity,
      LessonAgentEventEntity,
      LessonAgentStepFeedbackEntity,
      TeacherAgentSettingsEntity,
      LessonEntity,
      CourseEntity,
      VideoEntity,
      DocumentEntity,
      QuizEntity,
    ]),
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule).
    SessionsModule,
    JobsModule,
    EnrollmentsModule,
    NotificationsModule,
    TeacherBillingModule,
  ],
  controllers: [LessonAgentsController],
  providers: [LessonAgentsService],
  exports: [LessonAgentsService],
})
export class LessonAgentsModule {}
