import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_HINT, PASSWORD_PATTERN } from './password-policy';

export class PasswordResetDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_HINT })
  newPassword!: string;
}
