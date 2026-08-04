import { IsIn, IsOptional } from 'class-validator';

export class ConfirmOrderDto {
  // Test-only switch for the deterministic adapter (default 'success').
  // 'decline' records a failed payment attempt and leaves the order
  // retryable. This is the ONLY client-controlled field — there is no
  // card, price, currency, or paid-status input anywhere on this path.
  @IsOptional()
  @IsIn(['success', 'decline'])
  simulate?: 'success' | 'decline';
}
