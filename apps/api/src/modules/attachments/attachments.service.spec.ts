import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../documents/entities/file.entity';
import { STORAGE_ADAPTER } from '../documents/storage/local-storage.adapter';
import { AttachmentsService } from './attachments.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let filesRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let storageAdapter: {
    save: jest.Mock;
    read: jest.Mock;
  };

  beforeEach(async () => {
    filesRepository = {
      findOne: jest.fn(),
      save: jest.fn((entity) => Promise.resolve({ id: 'file-1', ...entity })),
      create: jest.fn((entity) => entity),
    };

    storageAdapter = {
      save: jest.fn().mockResolvedValue({
        storageProvider: 'local',
        storagePath: 'storage/file-1.png',
      }),
      read: jest.fn().mockResolvedValue(Buffer.from('test-content')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: filesRepository,
        },
        {
          provide: STORAGE_ADAPTER,
          useValue: storageAdapter,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  describe('saveAttachment', () => {
    it('saves a valid image attachment', async () => {
      const buffer = Buffer.from('image data');
      const result = await service.saveAttachment({
        buffer,
        originalName: 'screenshot.png',
        mimeType: 'image/png',
        sizeBytes: buffer.length,
        uploadedById: 'user-1',
      });

      expect(result.fileName).toBe('screenshot.png');
      expect(storageAdapter.save).toHaveBeenCalledWith(buffer);
      expect(filesRepository.save).toHaveBeenCalled();
    });

    it('rejects unsupported mime types', async () => {
      await expect(
        service.saveAttachment({
          buffer: Buffer.from('exe data'),
          originalName: 'malware.exe',
          mimeType: 'application/x-msdownload',
          sizeBytes: 10,
          uploadedById: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects empty attachments', async () => {
      await expect(
        service.saveAttachment({
          buffer: Buffer.alloc(0),
          originalName: 'empty.png',
          mimeType: 'image/png',
          sizeBytes: 0,
          uploadedById: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFileForDownload', () => {
    it('returns file buffer and metadata when file exists', async () => {
      filesRepository.findOne.mockResolvedValue({
        id: 'file-1',
        fileName: 'screenshot.png',
        mimeType: 'image/png',
        storagePath: 'storage/file-1.png',
      });

      const result = await service.getFileForDownload('file-1');

      expect(result.fileName).toBe('screenshot.png');
      expect(result.mimeType).toBe('image/png');
      expect(result.buffer.toString()).toBe('test-content');
      expect(storageAdapter.read).toHaveBeenCalledWith('storage/file-1.png');
    });

    it('throws NotFoundException when file does not exist', async () => {
      filesRepository.findOne.mockResolvedValue(null);

      await expect(service.getFileForDownload('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
