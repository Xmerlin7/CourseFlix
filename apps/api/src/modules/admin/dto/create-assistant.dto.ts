import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_HINT,
  PASSWORD_PATTERN,
} from '../../auth/dto/password-policy';

// No teacherId field — the platform has exactly one teacher, so
// AdminUsersService.createAssistant resolves and links to it server-side.
export class CreateAssistantDto {
  @IsString() @MinLength(3) fullName!: string;
  @IsEmail() email!: string;
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_HINT })
  password!: string;
}
