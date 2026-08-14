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
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { DiscussionHelpfulVoteEntity } from './entities/discussion-helpful-vote.entity';
import { DiscussionReplyEntity } from './entities/discussion-reply.entity';
import { DiscussionThreadAttachmentEntity } from './entities/discussion-thread-attachment.entity';
import { DiscussionThreadEntity } from './entities/discussion-thread.entity';

import { NotificationEntity } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiscussionThreadEntity,
      DiscussionReplyEntity,
      DiscussionHelpfulVoteEntity,
      DiscussionThreadAttachmentEntity,
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
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  // StudentService (StudentModule) needs the bulk community-summary
  // methods to build the "دوراتك" list preview/unread data.
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
