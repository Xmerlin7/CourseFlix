import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateLessonDto {
  @IsString() @Length(1, 200) title!: string;

  @IsOptional() @IsString() @MaxLength(5000) videoUrl?: string | null;
}
