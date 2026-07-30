import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import type { SectionStatus } from '../entities/section.entity';

export class UpdateSectionDto {
  @IsOptional() @IsString() @Length(1, 200) title?: string;

  @IsOptional() @IsIn(['draft', 'published']) status?: SectionStatus;
}
