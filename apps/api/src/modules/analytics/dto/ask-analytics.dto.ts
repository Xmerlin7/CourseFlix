import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskAnalyticsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question!: string;
}
