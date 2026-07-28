import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NOTIFICATION_PRODUCER_PORT } from '../../common/ports/notification-producer.port';
import { SessionsModule } from '../sessions/sessions.module';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule).
    SessionsModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    // NotificationsService already implements NotificationProducerPort —
    // `useExisting` binds the token to that same instance instead of
    // constructing a second one, so Elgendy's worker can later
    // `@Inject(NOTIFICATION_PRODUCER_PORT)` and get the real thing.
    { provide: NOTIFICATION_PRODUCER_PORT, useExisting: NotificationsService },
  ],
  exports: [NotificationsService, NOTIFICATION_PRODUCER_PORT],
})
export class NotificationsModule {}
