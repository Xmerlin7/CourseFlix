import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import {
  InMemoryJobQueue,
  JOB_QUEUE_PORT,
} from '../../common/ports/job-queue.port';
import { CourseEntity } from '../courses/entities/course.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentEntity } from './entities/document.entity';
import { FileEntity } from './entities/file.entity';
import {
  LocalStorageAdapter,
  STORAGE_ADAPTER,
} from './storage/local-storage.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity, FileEntity, CourseEntity]),
    // Buffered in memory, not disk — DocumentsService needs the raw
    // bytes for the SHA-256 checksum and the PDF magic-byte check
    // before LocalStorageAdapter ever writes to STORAGE_ROOT.
    MulterModule.register({ storage: memoryStorage() }),
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule).
    SessionsModule,
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    { provide: STORAGE_ADAPTER, useClass: LocalStorageAdapter },
    // Fake until Elgendy's real BullMQ adapter (apps/api/src/modules/jobs)
    // lands — swapping it is this one line (sprint2-plan.md §2.1).
    { provide: JOB_QUEUE_PORT, useClass: InMemoryJobQueue },
  ],
})
export class DocumentsModule {}
