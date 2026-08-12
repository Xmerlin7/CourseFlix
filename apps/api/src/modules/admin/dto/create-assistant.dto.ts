import { IsEmail, IsString, MinLength } from 'class-validator';

// No teacherId field — the platform has exactly one teacher, so
// AdminUsersService.createAssistant resolves and links to it server-side.
export class CreateAssistantDto {
  @IsString() @MinLength(3) fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
