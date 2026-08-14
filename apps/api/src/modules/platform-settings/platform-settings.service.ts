import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { PlatformSettingEntity } from './entities/platform-setting.entity';

export const AUTH_POSTER_FEATURED_COURSE_KEY = 'auth_poster_featured_course_id';
export const AUTH_POSTER_CUSTOMIZATION_KEY = 'auth_poster_customization';

export interface AuthPosterCustomization {
  badgeText: string;
  teacherPrefix: string;
  studyPlanValue: string;
  studyPlanLabel: string;
  quizValue: string;
  quizLabel: string;
  followUpValue: string;
  followUpLabel: string;
  journeyLabel: string;
}

export const DEFAULT_AUTH_POSTER_CUSTOMIZATION: AuthPosterCustomization = {
  badgeText: 'منصة تعليم تفاعلية',
  teacherPrefix: 'مع الأستاذ',
  studyPlanValue: '١٢ أسبوع',
  studyPlanLabel: 'خطة مذاكرة',
  quizValue: '٤٨ تدريب',
  quizLabel: 'اختبارات قصيرة',
  followUpValue: 'كل حصة',
  followUpLabel: 'متابعة تقدم',
  journeyLabel: 'رحلة الطالب',
};

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
  customization: AuthPosterCustomization;
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
    const customization = await this.getCustomization();
    const course = selectedCourseId
      ? await this.coursesRepository.findOne({
          where: { id: selectedCourseId, deletedAt: IsNull() },
          relations: { teacher: true },
        })
      : null;

    return this.toPosterResponse(course, selectedCourseId, customization);
  }

  async getPublicAuthPoster(): Promise<AuthPosterResponse> {
    const selectedCourseId = await this.getFeaturedCourseId();
    const customization = await this.getCustomization();
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

    return this.toPosterResponse(course, selectedCourseId, customization);
  }

  async updateAuthPoster(
    featuredCourseId: string | null | undefined,
    teacherId?: string,
    customization?: AuthPosterCustomization,
  ): Promise<AuthPosterResponse> {
    const normalizedCourseId = featuredCourseId ?? null;

    if (normalizedCourseId) {
      const course = await this.coursesRepository.findOne({
        where: {
          id: normalizedCourseId,
          ...(teacherId ? { teacherId } : {}),
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

    if (featuredCourseId !== undefined) {
      await this.settingsRepository.save({
        key: AUTH_POSTER_FEATURED_COURSE_KEY,
        value: normalizedCourseId,
      });
    }

    if (customization) {
      await this.settingsRepository.save({
        key: AUTH_POSTER_CUSTOMIZATION_KEY,
        value: JSON.stringify(this.normalizeCustomization(customization)),
      });
    }

    return this.getAdminAuthPoster();
  }

  private async getFeaturedCourseId(): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({
      where: { key: AUTH_POSTER_FEATURED_COURSE_KEY },
    });
    return setting?.value ?? null;
  }

  private async getCustomization(): Promise<AuthPosterCustomization> {
    const setting = await this.settingsRepository.findOne({
      where: { key: AUTH_POSTER_CUSTOMIZATION_KEY },
    });

    if (!setting?.value) return DEFAULT_AUTH_POSTER_CUSTOMIZATION;

    try {
      return this.normalizeCustomization(
        JSON.parse(setting.value) as Partial<AuthPosterCustomization>,
      );
    } catch {
      return DEFAULT_AUTH_POSTER_CUSTOMIZATION;
    }
  }

  private normalizeCustomization(
    value: Partial<AuthPosterCustomization>,
  ): AuthPosterCustomization {
    return Object.fromEntries(
      Object.entries(DEFAULT_AUTH_POSTER_CUSTOMIZATION).map(
        ([key, fallback]) => {
          const candidate = value[key as keyof AuthPosterCustomization];
          return [
            key,
            typeof candidate === 'string' && candidate.trim()
              ? candidate.trim()
              : fallback,
          ];
        },
      ),
    ) as unknown as AuthPosterCustomization;
  }

  private toPosterResponse(
    course: CourseEntity | null,
    selectedCourseId: string | null,
    customization: AuthPosterCustomization,
  ): AuthPosterResponse {
    if (!course) {
      return {
        featuredCourseId: selectedCourseId,
        course: FALLBACK_COURSE,
        isFallback: true,
        customization,
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
      customization,
    };
  }
}
