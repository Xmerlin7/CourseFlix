import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateCourseDto {
  @IsString() @Length(3, 150) title!: string;

  @IsOptional() @IsString() @MaxLength(5000) description?: string | null;

  @IsOptional() @IsUrl() coverImageUrl?: string | null;

  @IsOptional() @IsString() @MaxLength(100) gradeLevel?: string | null;
}
