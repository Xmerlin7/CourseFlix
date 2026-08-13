import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAuthPosterDto {
  @IsOptional()
  @IsUUID()
  featuredCourseId?: string | null;
}
