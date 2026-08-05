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

export class UpdateQuestionDto {
  @IsOptional() @IsUUID() id?: string;
  @IsEnum(['mcq', 'true_false']) type!: string;
  @IsString() @IsNotEmpty() text!: string;
  @IsArray() @IsString({ each: true }) options!: string[];
  @IsString() @IsNotEmpty() correctAnswer!: string;
}

export class UpdateQuizDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  questions?: UpdateQuestionDto[];
}
