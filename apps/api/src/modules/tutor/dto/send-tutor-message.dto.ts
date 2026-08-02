import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendTutorMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;
}
