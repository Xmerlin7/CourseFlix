import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AttachmentsModule } from '../attachments/attachments.module';
import { CourseEntity } from '../courses/entities/course.entity';
import { FileEntity } from '../documents/entities/file.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UserEntity } from '../users/entities/user.entity';
import { SupportMessageEntity } from './entities/support-message.entity';
import { SupportTicketAttachmentEntity } from './entities/support-ticket-attachment.entity';
import { SupportTicketEntity } from './entities/support-ticket.entity';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

import { NotificationEntity } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportTicketEntity,
      SupportMessageEntity,
      SupportTicketAttachmentEntity,
      FileEntity,
      CourseEntity,
      UserEntity,
      NotificationEntity,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
    SessionsModule,
    EnrollmentsModule,
    NotificationsModule,
    AttachmentsModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
