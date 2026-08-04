import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AGENT_LOG_PORT } from '../../common/ports/agent-log.port';
import { CoursesModule } from '../courses/courses.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AgentLogsController } from './agent-logs.controller';
import { AgentLogsService } from './agent-logs.service';
import { AgentLogEntity } from './entities/agent-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentLogEntity]),
    CoursesModule,
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule).
    SessionsModule,
  ],
  controllers: [AgentLogsController],
  providers: [
    AgentLogsService,
    // AgentLogsService already implements AgentLogPort — `useExisting`
    // binds the token to that same instance so other modules (the
    // intervention rule evaluator, later the Analytics Agent) can
    // `@Inject(AGENT_LOG_PORT)` and get the real thing.
    { provide: AGENT_LOG_PORT, useExisting: AgentLogsService },
  ],
  exports: [AgentLogsService, AGENT_LOG_PORT],
})
export class AgentLogsModule {}
