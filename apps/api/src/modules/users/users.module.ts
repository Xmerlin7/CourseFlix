// apps/api/src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { SessionsModule } from '../sessions/sessions.module';
import { UserEntity } from './entities/user.entity';
import { StudentTeacherContactController } from './student-teacher-contact.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule,
    // mirrored in NotificationsModule).
    SessionsModule,
    // Buffered in memory, not disk — uploadAvatar streams the raw bytes
    // straight to Cloudinary, same rationale as DocumentsModule's own
    // memoryStorage() for the PDF checksum/magic-byte check.
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [UsersController, StudentTeacherContactController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
