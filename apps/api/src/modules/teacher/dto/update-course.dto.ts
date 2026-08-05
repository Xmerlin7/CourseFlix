import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';

/**
 * Teacher-editable course metadata fields per sprint1-plan.md's endpoint
 * contract. Slug editing is explicitly excluded. `@IsOptional()` treats
 * both `undefined` and `null` as "skip validation", so `null` is
 * accepted for the nullable fields to explicitly clear them.
 */
export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @Length(3, 150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsUrl()
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gradeLevel?: string | null;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';
}
