import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from '../documents/documents.module';
import { FileEntity } from '../documents/entities/file.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    // For STORAGE_ADAPTER — DocumentsModule already exports it.
    DocumentsModule,
    SessionsModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
