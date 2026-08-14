import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { PlatformSettingEntity } from './entities/platform-setting.entity';

export const AUTH_POSTER_FEATURED_COURSE_KEY = 'auth_poster_featured_course_id';

export interface AuthPosterCourse {
  id: string | null;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  gradeLevel: string | null;
  teacherName: string;
}

export interface AuthPosterResponse {
  featuredCourseId: string | null;
  course: AuthPosterCourse;
  isFallback: boolean;
}

const FALLBACK_COURSE: AuthPosterCourse = {
  id: null,
  title: 'الفيزياء',
  description:
    'حصص منظمة، مراجعات ذكية، ومتابعة تقدم تساعدك تدخل الحصة وانت عارف خطوتك الجاية.',
  coverImageUrl: null,
  gradeLevel: 'من الإعدادي للثانوي',
  teacherName: 'محمد عبدالرحمن',
};

@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectRepository(PlatformSettingEntity)
    private readonly settingsRepository: Repository<PlatformSettingEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
  ) {}

  async getAdminAuthPoster(): Promise<AuthPosterResponse> {
    const selectedCourseId = await this.getFeaturedCourseId();
    const course = selectedCourseId
      ? await this.coursesRepository.findOne({
          where: { id: selectedCourseId, deletedAt: IsNull() },
          relations: { teacher: true },
        })
      : null;

    return this.toPosterResponse(course, selectedCourseId);
  }

  async getPublicAuthPoster(): Promise<AuthPosterResponse> {
    const selectedCourseId = await this.getFeaturedCourseId();
    const course = selectedCourseId
      ? await this.coursesRepository.findOne({
          where: {
            id: selectedCourseId,
            status: 'published',
            deletedAt: IsNull(),
          },
          relations: { teacher: true },
        })
      : null;

    return this.toPosterResponse(course, selectedCourseId);
  }

  async updateAuthPoster(
    featuredCourseId: string | null | undefined,
  ): Promise<AuthPosterResponse> {
    const normalizedCourseId = featuredCourseId ?? null;

    if (normalizedCourseId) {
      const course = await this.coursesRepository.findOne({
        where: {
          id: normalizedCourseId,
          status: 'published',
          deletedAt: IsNull(),
        },
      });

      if (!course) {
        throw new BadRequestException(
          'Featured course must be a published, active course.',
        );
      }
    }

    await this.settingsRepository.save({
      key: AUTH_POSTER_FEATURED_COURSE_KEY,
      value: normalizedCourseId,
    });

    return this.getAdminAuthPoster();
  }

  private async getFeaturedCourseId(): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({
      where: { key: AUTH_POSTER_FEATURED_COURSE_KEY },
    });
    return setting?.value ?? null;
  }

  private toPosterResponse(
    course: CourseEntity | null,
    selectedCourseId: string | null,
  ): AuthPosterResponse {
    if (!course) {
      return {
        featuredCourseId: selectedCourseId,
        course: FALLBACK_COURSE,
        isFallback: true,
      };
    }

    return {
      featuredCourseId: course.id,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        gradeLevel: course.gradeLevel,
        teacherName: course.teacher?.fullName ?? FALLBACK_COURSE.teacherName,
      },
      isFallback: false,
    };
  }
}
