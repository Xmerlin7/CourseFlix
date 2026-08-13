import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantActionEntity } from './entities/assistant-action.entity';
import { AssistantActionsController } from './assistant-actions.controller';
import { AssistantActionsService } from './assistant-actions.service';
import { PendingApprovalInterceptor } from './pending-approval.interceptor';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UserEntity } from '../users/entities/user.entity';
import { TeacherService } from '../teacher/teacher.service';

/**
 * Approval queue for assistant writes — scoped to course/section/lesson
 * structure only (see assistant-action.registry.ts). Quizzes, exam
 * generation and document retries are not gated.
 *
 * TeacherService is resolved at bootstrap through ModuleRef rather than
 * imported as a module dependency: TeacherModule mounts
 * PendingApprovalInterceptor, which needs AssistantActionsService — so
 * importing TeacherModule here would be a cycle. `{ strict: false }`
 * looks it up from the fully-built root container after all modules have
 * initialised, which sidesteps the cycle without a forwardRef.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AssistantActionEntity, UserEntity]),
    NotificationsModule,
    // Needed directly (not just transitively) for AuthGuard to resolve
    // SessionsService inside this module's DI context — same CF-BUG-001
    // note as TeacherModule.
    SessionsModule,
  ],
  controllers: [AssistantActionsController],
  providers: [AssistantActionsService, PendingApprovalInterceptor],
  exports: [AssistantActionsService, PendingApprovalInterceptor],
})
export class AssistantActionsModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly actions: AssistantActionsService,
  ) {}

  onModuleInit(): void {
    this.actions.setReplayDeps({
      teacherService: this.moduleRef.get(TeacherService, { strict: false }),
    });
  }
}
