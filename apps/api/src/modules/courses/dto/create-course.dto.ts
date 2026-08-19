import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsString() @Length(3, 150) title!: string;

  @IsOptional() @IsString() @MaxLength(5000) description?: string | null;

  @IsOptional() @IsUrl() coverImageUrl?: string | null;

  @IsOptional() @IsString() @MaxLength(100) gradeLevel?: string | null;

  // EGP minor units (1/100 EGP). Omitted (or null) means "use the
  // platform default price" — see `CourseEntity.priceMinor`.
  @IsOptional() @IsInt() @Min(0) @Max(100_000_00) priceMinor?: number | null;
}
