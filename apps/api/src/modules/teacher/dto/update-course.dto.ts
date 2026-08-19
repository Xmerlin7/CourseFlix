import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
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

  // EGP minor units (1/100 EGP), same unit `order_items.price_minor`
  // uses. `null` explicitly resets the course to the platform default
  // price; omitted leaves whatever price is already set untouched.
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_00)
  priceMinor?: number | null;
}
