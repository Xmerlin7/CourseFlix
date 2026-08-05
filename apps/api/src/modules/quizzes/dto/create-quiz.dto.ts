import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionDto {
  @IsEnum(['mcq', 'true_false']) type!: string;
  @IsString() @IsNotEmpty() text!: string;
  @IsArray() @IsString({ each: true }) options!: string[];
  @IsString() @IsNotEmpty() correctAnswer!: string;
}

export class CreateQuizDto {
  @IsUUID() courseId!: string;
  @IsOptional() @IsUUID() sectionId?: string;
  @IsOptional() @IsUUID() lessonId?: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}
