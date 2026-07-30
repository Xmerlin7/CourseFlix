import { IsIn, IsOptional, IsString, IsUrl, Length } from 'class-validator';
import type { LessonStatus } from '../entities/lesson.entity';

export class UpdateLessonDto {
  @IsOptional() @IsString() @Length(1, 200) title?: string;

  @IsOptional() @IsUrl() videoUrl?: string | null;

  @IsOptional() @IsIn(['draft', 'published']) status?: LessonStatus;
}
