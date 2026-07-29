import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { JOB_QUEUE_PORT } from '../../common/ports/job-queue.port';
import type { JobQueuePort } from '../../common/ports/job-queue.port';
import { CourseEntity } from '../courses/entities/course.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';
import {
  DocumentEntity,
  DocumentProcessingStatus,
} from './entities/document.entity';
import { FileEntity } from './entities/file.entity';
import { STORAGE_ADAPTER } from './storage/local-storage.adapter';
import type { StorageAdapter } from './storage/local-storage.adapter';

const PDF_MAGIC_BYTES = Buffer.from('%PDF');
const DEFAULT_MAX_UPLOAD_BYTES = 20_971_520; // 20 MiB, matches .env.example

export interface CourseDocumentResponse {
  id: string;
  fileName: string;
  processingStatus: DocumentProcessingStatus;
  version: number;
  createdAt: string;
  errorMessage: string | null;
}

export interface UploadDocumentResponse {
  id: string;
  fileName: string;
  processingStatus: DocumentProcessingStatus;
  version: number;
}

export interface RetryDocumentResponse {
  id: string;
  processingStatus: DocumentProcessingStatus;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @Inject(STORAGE_ADAPTER)
    private readonly storageAdapter: StorageAdapter,
    @Inject(JOB_QUEUE_PORT)
    private readonly jobQueue: JobQueuePort,
  ) {}

  /**
   * Validation runs before a single byte is stored, in the order fixed
   * by sprint2-plan.md's H-2: file shape -> size -> non-empty ->
   * ownership. A rejected upload never creates a `documents` row.
   *
   * Re-uploading a file whose SHA-256 already matches an active
   * document *in the same course* bumps that document's version
   * instead of creating a duplicate row — scoped to the course because
   * the same PDF attached to a different course is a distinct document,
   * not a new version of an unrelated one.
   */
  async uploadDocument(
    courseId: string,
    teacherId: string,
    upload: UploadDocumentDto,
  ): Promise<UploadDocumentResponse> {
    this.assertValidPdf(upload);
    this.assertWithinSizeLimit(upload.sizeBytes);
    this.assertNonEmpty(upload.sizeBytes);
    await this.assertTeacherOwnsCourse(courseId, teacherId);

    const checksum = createHash('sha256').update(upload.buffer).digest('hex');
    const stored = await this.storageAdapter.save(upload.buffer);
    const file = await this.filesRepository.save(
      this.filesRepository.create({
        fileName: upload.originalName,
        mimeType: upload.mimeType,
        sizeBytes: String(upload.sizeBytes),
        storageProvider: stored.storageProvider,
        storagePath: stored.storagePath,
        checksum,
        uploadedBy: teacherId,
      }),
    );

    const existing = await this.documentsRepository.findOne({
      where: { courseId, checksum, deletedAt: IsNull() },
    });

    const document = existing
      ? await this.documentsRepository.save({
          ...existing,
          fileId: file.id,
          version: existing.version + 1,
          processingStatus: 'pending' as const,
          errorMessage: null,
        })
      : await this.documentsRepository.save(
          this.documentsRepository.create({
            courseId,
            uploadedBy: teacherId,
            fileId: file.id,
            fileName: upload.originalName,
            fileType: 'pdf',
            processingStatus: 'pending',
            checksum,
            version: 1,
          }),
        );

    await this.jobQueue.enqueueDocumentIngestion(document.id, document.version);

    return {
      id: document.id,
      fileName: document.fileName,
      processingStatus: document.processingStatus,
      version: document.version,
    };
  }

  async listCourseDocuments(
    courseId: string,
    teacherId: string,
  ): Promise<CourseDocumentResponse[]> {
    await this.assertTeacherOwnsCourse(courseId, teacherId);

    const documents = await this.documentsRepository.find({
      where: { courseId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      processingStatus: document.processingStatus,
      version: document.version,
      createdAt: document.createdAt.toISOString(),
      errorMessage: document.errorMessage,
    }));
  }

  async retryDocument(
    documentId: string,
    teacherId: string,
  ): Promise<RetryDocumentResponse> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, deletedAt: IsNull() },
    });
    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    await this.assertTeacherOwnsCourse(document.courseId, teacherId);

    if (document.processingStatus !== 'failed') {
      throw new ConflictException('Only a failed document can be retried.');
    }

    const saved = await this.documentsRepository.save({
      ...document,
      processingStatus: 'pending' as const,
      errorMessage: null,
    });

    await this.jobQueue.enqueueDocumentIngestion(saved.id, saved.version);

    return { id: saved.id, processingStatus: saved.processingStatus };
  }

  private async assertTeacherOwnsCourse(
    courseId: string,
    teacherId: string,
  ): Promise<CourseEntity> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course.');
    }
    return course;
  }

  // Never trust the extension or the client's Content-Type: the
  // declared MIME must say PDF *and* the file must actually start with
  // the PDF magic bytes.
  private assertValidPdf(upload: UploadDocumentDto): void {
    const hasPdfMagicBytes = upload.buffer
      .subarray(0, PDF_MAGIC_BYTES.length)
      .equals(PDF_MAGIC_BYTES);

    if (upload.mimeType !== 'application/pdf' || !hasPdfMagicBytes) {
      throw new BadRequestException('الملف المرفوع يجب أن يكون ملف PDF صالح.');
    }
  }

  private assertWithinSizeLimit(sizeBytes: number): void {
    const maxBytes = Number(
      process.env.MAX_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES,
    );
    if (sizeBytes > maxBytes) {
      throw new PayloadTooLargeException(
        'حجم الملف يتجاوز الحد الأقصى المسموح به.',
      );
    }
  }

  private assertNonEmpty(sizeBytes: number): void {
    if (sizeBytes <= 0) {
      throw new BadRequestException('لا يمكن رفع ملف فارغ.');
    }
  }
}
