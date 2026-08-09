import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// Deliberately narrower than EnrollmentStatus ('completed' is a system-
// driven state, not something a teacher/assistant sets by hand here).
export class UpdateEnrollmentStatusDto {
  @IsIn(['active', 'suspended'])
  status!: 'active' | 'suspended';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
