import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_HINT,
  PASSWORD_PATTERN,
} from '../../auth/dto/password-policy';

// Mirrors auth/dto/register.dto.ts's validation rules — the only
// difference is this is admin-only and the resulting account gets
// role: 'admin' instead of the hardcoded 'student'.
export class CreateAdminDto {
  @IsString() @MinLength(3) fullName!: string;
  @IsEmail() email!: string;
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_HINT })
  password!: string;
}
