import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { FileEntity } from '../documents/entities/file.entity';
import { STORAGE_ADAPTER } from '../documents/storage/local-storage.adapter';
import type { StorageAdapter } from '../documents/storage/local-storage.adapter';

const MAX_ATTACHMENT_BYTES = 15_728_640; // 15 MiB
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export interface UploadAttachmentInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
}

/**
 * Shared "attach a screenshot/file" primitive for Community questions and
 * Support tickets — reuses the `files` table and `LocalStorageAdapter`
 * that DocumentsModule already owns instead of a second storage system.
 * Deliberately image/PDF-only and much smaller than the 20 MiB teacher
 * course-material cap: these are chat-style attachments, not lecture
 * materials.
 */
@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    @Inject(STORAGE_ADAPTER)
    private readonly storageAdapter: StorageAdapter,
  ) {}

  async saveAttachment(input: UploadAttachmentInput): Promise<FileEntity> {
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new BadRequestException(
        'نوع الملف غير مدعوم. الأنواع المسموح بها: صور أو PDF.',
      );
    }
    if (input.sizeBytes === 0) {
      throw new BadRequestException('الملف المرفق فارغ.');
    }
    if (input.sizeBytes > MAX_ATTACHMENT_BYTES) {
      throw new PayloadTooLargeException(
        'حجم الملف أكبر من الحد المسموح به (15 ميجابايت).',
      );
    }

    const checksum = createHash('sha256').update(input.buffer).digest('hex');
    const stored = await this.storageAdapter.save(input.buffer);

    return this.filesRepository.save(
      this.filesRepository.create({
        fileName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: String(input.sizeBytes),
        storageProvider: stored.storageProvider,
        storagePath: stored.storagePath,
        checksum,
        uploadedBy: input.uploadedById,
      }),
    );
  }
}
