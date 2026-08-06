import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentEntity } from '../../documents/entities/document.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { AdminDocumentsService } from './admin-documents.service';

describe('AdminDocumentsService', () => {
  let service: AdminDocumentsService;
  let documentsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };
  let coursesRepository: { find: jest.Mock };

  const documentId = 'document-1';
  const courseId = 'course-1';

  beforeEach(async () => {
    documentsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };
    coursesRepository = { find: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminDocumentsService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: documentsRepository,
        },
        {
          provide: getRepositoryToken(CourseEntity),
          useValue: coursesRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(AdminDocumentsService);
  });

  it('resolves the course title for each listed document', async () => {
    documentsRepository.find.mockResolvedValue([
      {
        id: documentId,
        fileName: 'chapter-1.pdf',
        courseId,
        processingStatus: 'completed',
        version: 1,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        errorMessage: null,
      },
    ]);
    coursesRepository.find.mockResolvedValue([
      { id: courseId, title: 'الفيزياء' },
    ]);

    const result = await service.listDocuments({});

    expect(result[0].courseTitle).toBe('الفيزياء');
  });

  it('soft-removes an existing document', async () => {
    const document = { id: documentId, deletedAt: null };
    documentsRepository.findOne.mockResolvedValue(document);

    await service.deleteDocument(documentId);

    expect(documentsRepository.softRemove).toHaveBeenCalledWith(document);
  });

  it('throws NotFoundException for a missing document', async () => {
    documentsRepository.findOne.mockResolvedValue(null);
    await expect(service.deleteDocument('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
