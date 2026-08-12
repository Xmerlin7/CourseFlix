import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { AttachmentsModule } from '../attachments/attachments.module';
import { CourseEntity } from '../courses/entities/course.entity';
import { FileEntity } from '../documents/entities/file.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { PostAttachmentEntity } from './entities/post-attachment.entity';
import { PostEntity } from './entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostAttachmentEntity,
      FileEntity,
      CourseEntity,
      EnrollmentEntity,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
    SessionsModule,
    EnrollmentsModule,
    NotificationsModule,
    AttachmentsModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
