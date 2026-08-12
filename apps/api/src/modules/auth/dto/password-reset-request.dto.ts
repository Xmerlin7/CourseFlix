import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class PasswordResetRequestDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
