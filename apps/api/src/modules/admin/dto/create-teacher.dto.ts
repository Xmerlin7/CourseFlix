import { IsEmail, IsString, MinLength } from 'class-validator';

// Mirrors create-admin.dto.ts. The platform supports exactly one teacher
// account — AdminUsersService.createTeacher rejects the request if one
// already exists.
export class CreateTeacherDto {
  @IsString() @MinLength(3) fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
