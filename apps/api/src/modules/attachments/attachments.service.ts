import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
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
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
]);

export interface UploadAttachmentInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
}

export interface AttachmentDownloadFile {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Shared "attach a screenshot/file" primitive for Community questions,
 * Announcements, and Support tickets — reuses the `files` table and
 * `LocalStorageAdapter` that DocumentsModule already owns.
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
        'نوع الملف غير مدعوم. يرجى إرفاق صور، PDF، أو مستندات صالحة.',
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

  async getFileForDownload(fileId: string): Promise<AttachmentDownloadFile> {
    const file = await this.filesRepository.findOne({
      where: { id: fileId },
    });
    if (!file) {
      throw new NotFoundException('المرفق غير موجود.');
    }

    const buffer = await this.storageAdapter.read(file.storagePath);
    return {
      buffer,
      mimeType: file.mimeType,
      fileName: file.fileName,
    };
  }
}
