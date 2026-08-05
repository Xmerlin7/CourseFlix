import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  courseId!: string;

  // Optional client-generated key that makes order creation idempotent:
  // repeating the same key returns the existing draft instead of a
  // second order. Never used for payment (see CF-TASK-059).
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
