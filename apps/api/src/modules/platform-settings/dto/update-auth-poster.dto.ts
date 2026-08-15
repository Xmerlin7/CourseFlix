import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateAuthPosterCustomizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  badgeText!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  teacherPrefix!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  studyPlanValue!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  studyPlanLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  quizValue!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  quizLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  followUpValue!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  followUpLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  journeyLabel!: string;
}

export class UpdateAuthPosterDto {
  @IsOptional()
  @IsUUID()
  featuredCourseId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAuthPosterCustomizationDto)
  customization?: UpdateAuthPosterCustomizationDto;
}
