import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';

describe('TutorController', () => {
  let controller: TutorController;
  let tutorService: jest.Mocked<
    Pick<TutorService, 'getCourseMessages' | 'sendMessage'>
  >;

  beforeEach(() => {
    tutorService = {
      getCourseMessages: jest.fn().mockResolvedValue([]),
      sendMessage: jest.fn(),
    };
    controller = new TutorController(tutorService as TutorService);
  });

  it('reads course-scoped Tutor history for the current student', async () => {
    tutorService.getCourseMessages.mockResolvedValueOnce([
      {
        id: 'message-1',
        role: 'student',
        text: 'اشرح الدرس',
        createdAt: '2026-08-04T10:00:00.000Z',
      },
    ]);

    await expect(
      controller.getMessages('course-1', {
        id: 'student-1',
        email: 'student@example.com',
        fullName: 'Student',
        role: 'student',
        avatarUrl: null,
      }),
    ).resolves.toEqual([
      {
        id: 'message-1',
        role: 'student',
        text: 'اشرح الدرس',
        createdAt: '2026-08-04T10:00:00.000Z',
      },
    ]);
    expect(tutorService.getCourseMessages).toHaveBeenCalledWith({
      courseId: 'course-1',
      studentId: 'student-1',
    });
  });
});
