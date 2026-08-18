import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INTERVENTION_EVALUATOR_PORT } from '../../common/ports/intervention-evaluator.port';
import { AgentLogsModule } from '../agent-logs/agent-logs.module';
import { CoursesModule } from '../courses/courses.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UserEntity } from '../users/entities/user.entity';
import { SupportModule } from '../support/support.module';
import { InterventionMiniQuizQuestionEntity } from './entities/intervention-mini-quiz-question.entity';
import { InterventionMiniQuizEntity } from './entities/intervention-mini-quiz.entity';
import { InterventionEvidenceEntity } from './entities/intervention-evidence.entity';
import { InterventionEntity } from './entities/intervention.entity';
import { ProgressReportEntity } from './entities/progress-report.entity';
import { InterventionsController } from './interventions.controller';
import { InterventionsService } from './interventions.service';
import { MiniQuizController } from './mini-quiz.controller';
import { MiniQuizService } from './mini-quiz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InterventionEntity,
      InterventionEvidenceEntity,
      ProgressReportEntity,
      UserEntity,
      InterventionMiniQuizEntity,
      InterventionMiniQuizQuestionEntity,
    ]),
    CoursesModule,
    NotificationsModule,
    AgentLogsModule,
    SupportModule,
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule).
    SessionsModule,
  ],
  controllers: [InterventionsController, MiniQuizController],
  providers: [
    InterventionsService,
    MiniQuizService,
    // InterventionsService already implements InterventionEvaluatorPort
    // — `useExisting` binds the token so quizzes/tutor modules can
    // `@Inject(INTERVENTION_EVALUATOR_PORT)` and get the real thing.
    {
      provide: INTERVENTION_EVALUATOR_PORT,
      useExisting: InterventionsService,
    },
  ],
  exports: [InterventionsService, MiniQuizService, INTERVENTION_EVALUATOR_PORT],
})
export class InterventionsModule {}
