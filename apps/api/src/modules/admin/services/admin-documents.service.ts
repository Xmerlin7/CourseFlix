import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  DocumentEntity,
  DocumentProcessingStatus,
} from '../../documents/entities/document.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { ListDocumentsQueryDto } from '../dto/list-documents-query.dto';

export interface AdminDocumentListItem {
  id: string;
  fileName: string;
  courseId: string;
  courseTitle: string;
  processingStatus: DocumentProcessingStatus;
  version: number;
  createdAt: string;
  errorMessage: string | null;
}

const MAX_RESULTS = 200;

@Injectable()
export class AdminDocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
  ) {}

  async listDocuments(
    query: ListDocumentsQueryDto,
  ): Promise<AdminDocumentListItem[]> {
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (query.courseId) where.courseId = query.courseId;

    const documents = await this.documentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: MAX_RESULTS,
    });

    const courseTitles = await this.loadCourseTitles(
      documents.map((document) => document.courseId),
    );

    return documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      courseId: document.courseId,
      courseTitle: courseTitles.get(document.courseId) ?? '—',
      processingStatus: document.processingStatus,
      version: document.version,
      createdAt: document.createdAt.toISOString(),
      errorMessage: document.errorMessage,
    }));
  }

  // Setting deletedAt is also the documented trigger for the async
  // ChromaDB vector purge (see DocumentEntity's docblock) — softRemove
  // is the complete delete action, no extra cleanup needed here.
  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, deletedAt: IsNull() },
    });
    if (!document) {
      throw new NotFoundException('Document not found.');
    }
    await this.documentsRepository.softRemove(document);
  }

  private async loadCourseTitles(
    courseIds: string[],
  ): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(courseIds)];
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const courses = await this.coursesRepository.find({
      where: { id: In(uniqueIds) },
    });
    return new Map(courses.map((course) => [course.id, course.title]));
  }
}
