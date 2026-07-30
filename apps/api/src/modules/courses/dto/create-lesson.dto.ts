import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateLessonDto {
  @IsString() @Length(1, 200) title!: string;

  @IsOptional() @IsUrl() videoUrl?: string | null;
}
