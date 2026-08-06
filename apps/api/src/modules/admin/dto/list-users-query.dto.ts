import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(['student', 'teacher', 'admin'])
  role?: 'student' | 'teacher' | 'admin';

  @IsOptional()
  @IsIn(['active', 'suspended', 'inactive'])
  status?: 'active' | 'suspended' | 'inactive';

  // Matched against fullName/email, case-insensitive, substring match.
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}
