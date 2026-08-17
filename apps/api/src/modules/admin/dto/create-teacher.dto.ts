import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_HINT,
  PASSWORD_PATTERN,
} from '../../auth/dto/password-policy';

// Mirrors create-admin.dto.ts. The platform supports exactly one teacher
// account — AdminUsersService.createTeacher rejects the request if one
// already exists.
export class CreateTeacherDto {
  @IsString() @MinLength(3) fullName!: string;
  @IsEmail() email!: string;
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_HINT })
  password!: string;
}
