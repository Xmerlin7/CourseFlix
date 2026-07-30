import { IsEnum } from 'class-validator';
import type { EnrollmentStatus } from '../entities/enrollment.entity';

export class UpdateEnrollmentDto {
  @IsEnum(['active', 'suspended', 'completed'])
  status!: EnrollmentStatus;
}
