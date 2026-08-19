import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let service: {
    getFileForDownload: jest.Mock;
  };
  let mockRes: {
    set: jest.Mock;
  };

  beforeEach(() => {
    service = {
      getFileForDownload: jest.fn().mockResolvedValue({
        buffer: Buffer.from('file-content'),
        mimeType: 'image/png',
        fileName: 'test.png',
      }),
    };
    mockRes = {
      set: jest.fn(),
    };
    controller = new AttachmentsController(
      service as unknown as AttachmentsService,
    );
  });

  it('streams the attachment and sets headers', async () => {
    const streamableFile = await controller.downloadAttachment(
      'file-1',
      mockRes as any,
    );

    expect(service.getFileForDownload).toHaveBeenCalledWith('file-1');
    expect(mockRes.set).toHaveBeenCalledWith({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="test.png"',
    });
    expect(streamableFile).toBeDefined();
  });
});
