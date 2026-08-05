import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import type { LessonStatus } from '../entities/lesson.entity';

export class UpdateLessonDto {
  @IsOptional() @IsString() @Length(1, 200) title?: string;

  @IsOptional() @IsString() @MaxLength(5000) videoUrl?: string | null;

  @IsOptional() @IsIn(['draft', 'published']) status?: LessonStatus;
}
