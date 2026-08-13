import { IsInt, IsPositive, Max } from 'class-validator';

export class TopUpQuotaDto {
  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  credits!: number;
}
