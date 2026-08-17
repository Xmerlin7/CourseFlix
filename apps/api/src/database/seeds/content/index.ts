import { CLASSICAL_MECHANICS_CONTENT } from './classical-mechanics.content';
import { ELECTROMAGNETISM_CONTENT } from './electromagnetism.content';
import { WAVES_AND_OPTICS_CONTENT } from './waves-and-optics.content';
import { THERMODYNAMICS_CONTENT } from './thermodynamics.content';
import { MODERN_PHYSICS_CONTENT } from './modern-physics.content';
import { PREP_SCIENCE_BASICS_CONTENT } from './prep-science-basics.content';
import { ARCHIVED_ASTRONOMY_CONTENT } from './archived-astronomy.content';
import { CourseContent, LessonContent } from './content.types';

export * from './content.types';

/**
 * One entry per `COURSE_BLUEPRINTS` slug (`course.seed.ts`) — every
 * course has real lesson content, not just the "primary" one.
 */
export const COURSE_CONTENT: CourseContent[] = [
  CLASSICAL_MECHANICS_CONTENT,
  ELECTROMAGNETISM_CONTENT,
  WAVES_AND_OPTICS_CONTENT,
  THERMODYNAMICS_CONTENT,
  MODERN_PHYSICS_CONTENT,
  PREP_SCIENCE_BASICS_CONTENT,
  ARCHIVED_ASTRONOMY_CONTENT,
];

export function findLessonContent(
  courseSlug: string,
  lessonTitle: string,
): LessonContent | undefined {
  return COURSE_CONTENT.find((course) => course.slug === courseSlug)?.lessons.find(
    (lesson) => lesson.lesson === lessonTitle,
  );
}

export function findCourseContent(courseSlug: string): CourseContent | undefined {
  return COURSE_CONTENT.find((course) => course.slug === courseSlug);
}
