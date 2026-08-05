import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Monotonicity and percentage derivation are enforced in
 * `LessonsService`, not here — this DTO only validates shape (both
 * fields are non-negative integers). See `docs/api/sprint2-lessons.md`.
 */
export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  positionSeconds!: number;

  @IsInt()
  @Min(0)
  watchedSeconds!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}
