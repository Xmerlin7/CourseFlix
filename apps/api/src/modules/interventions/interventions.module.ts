import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INTERVENTION_EVALUATOR_PORT } from '../../common/ports/intervention-evaluator.port';
import { AgentLogsModule } from '../agent-logs/agent-logs.module';
import { CoursesModule } from '../courses/courses.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UserEntity } from '../users/entities/user.entity';
import { InterventionEvidenceEntity } from './entities/intervention-evidence.entity';
import { InterventionEntity } from './entities/intervention.entity';
import { ProgressReportEntity } from './entities/progress-report.entity';
import { InterventionsController } from './interventions.controller';
import { InterventionsService } from './interventions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InterventionEntity,
      InterventionEvidenceEntity,
      ProgressReportEntity,
      UserEntity,
    ]),
    CoursesModule,
    NotificationsModule,
    AgentLogsModule,
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule).
    SessionsModule,
  ],
  controllers: [InterventionsController],
  providers: [
    InterventionsService,
    // InterventionsService already implements InterventionEvaluatorPort
    // — `useExisting` binds the token so quizzes/tutor modules can
    // `@Inject(INTERVENTION_EVALUATOR_PORT)` and get the real thing.
    {
      provide: INTERVENTION_EVALUATOR_PORT,
      useExisting: InterventionsService,
    },
  ],
  exports: [InterventionsService, INTERVENTION_EVALUATOR_PORT],
})
export class InterventionsModule {}
