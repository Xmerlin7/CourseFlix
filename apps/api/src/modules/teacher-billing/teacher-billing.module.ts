import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from '../sessions/sessions.module';
import { UserEntity } from '../users/entities/user.entity';
import { AdminQuotaController } from './admin-quota.controller';
import { TeacherQuotaEntity } from './entities/teacher-quota.entity';
import { TeacherBillingService } from './teacher-billing.service';
import { TeacherQuotaController } from './teacher-quota.controller';

@Module({
  // SessionsModule is required directly here for AuthGuard to resolve
  // SessionsService within this module's DI context (same CF-BUG-001
  // convention as TeacherModule).
  imports: [
    TypeOrmModule.forFeature([TeacherQuotaEntity, UserEntity]),
    SessionsModule,
  ],
  controllers: [AdminQuotaController, TeacherQuotaController],
  providers: [TeacherBillingService],
  exports: [TeacherBillingService],
})
export class TeacherBillingModule {}
