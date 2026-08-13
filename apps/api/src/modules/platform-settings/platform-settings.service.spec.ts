import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { PlatformSettingEntity } from './entities/platform-setting.entity';
import {
  AUTH_POSTER_FEATURED_COURSE_KEY,
  PlatformSettingsService,
} from './platform-settings.service';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;
  let settingsRepository: { findOne: jest.Mock; save: jest.Mock };
  let coursesRepository: { findOne: jest.Mock };

  const course = {
    id: '7c1f0a82-5dd4-41d9-a7a5-8fc6f52b9f66',
    title: 'رياضيات الثانوية العامة',
    description: 'خطة مذاكرة واضحة لكل طالب.',
    coverImageUrl: 'https://example.com/math.jpg',
    gradeLevel: 'الثالث الثانوي',
    teacher: { fullName: 'أحمد علي' },
  };

  beforeEach(async () => {
    settingsRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    coursesRepository = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlatformSettingsService,
        {
          provide: getRepositoryToken(PlatformSettingEntity),
          useValue: settingsRepository,
        },
        { provide: getRepositoryToken(CourseEntity), useValue: coursesRepository },
      ],
    }).compile();

    service = moduleRef.get(PlatformSettingsService);
  });

  it('returns fallback content without a configured course', async () => {
    settingsRepository.findOne.mockResolvedValue(null);

    const result = await service.getPublicAuthPoster();

    expect(result.isFallback).toBe(true);
    expect(result.featuredCourseId).toBeNull();
    expect(result.course.id).toBeNull();
    expect(coursesRepository.findOne).not.toHaveBeenCalled();
  });

  it('returns selected published course data for the public auth poster', async () => {
    settingsRepository.findOne.mockResolvedValue({
      key: AUTH_POSTER_FEATURED_COURSE_KEY,
      value: course.id,
    });
    coursesRepository.findOne.mockResolvedValue(course);

    const result = await service.getPublicAuthPoster();

    expect(coursesRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: course.id, status: 'published' }),
      }),
    );
    expect(result).toEqual({
      featuredCourseId: course.id,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        gradeLevel: course.gradeLevel,
        teacherName: course.teacher.fullName,
      },
      isFallback: false,
    });
  });

  it('falls back publicly when the configured course is not publishable', async () => {
    settingsRepository.findOne.mockResolvedValue({
      key: AUTH_POSTER_FEATURED_COURSE_KEY,
      value: course.id,
    });
    coursesRepository.findOne.mockResolvedValue(null);

    const result = await service.getPublicAuthPoster();

    expect(result.isFallback).toBe(true);
    expect(result.featuredCourseId).toBe(course.id);
  });

  it('saves a published active course as the featured auth poster course', async () => {
    coursesRepository.findOne.mockResolvedValueOnce(course).mockResolvedValueOnce(course);
    settingsRepository.findOne.mockResolvedValue({
      key: AUTH_POSTER_FEATURED_COURSE_KEY,
      value: course.id,
    });

    await service.updateAuthPoster(course.id);

    expect(settingsRepository.save).toHaveBeenCalledWith({
      key: AUTH_POSTER_FEATURED_COURSE_KEY,
      value: course.id,
    });
  });

  it('rejects a missing, deleted, or unpublished featured course', async () => {
    coursesRepository.findOne.mockResolvedValue(null);

    await expect(service.updateAuthPoster(course.id)).rejects.toThrow(
      BadRequestException,
    );
    expect(settingsRepository.save).not.toHaveBeenCalled();
  });
});
