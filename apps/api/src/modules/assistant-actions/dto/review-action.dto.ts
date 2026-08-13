import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewActionDto {
  /** Shown to the assistant as the rejection reason. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
