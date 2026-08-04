import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { PaymentStatus } from './order.entity';

/**
 * Mirrors the `payments` table created in migration
 * `1785000071000-CreatePayments.ts`.
 *
 * One row per payment attempt against an order. This sprint always uses
 * the deterministic `test_adapter`; `external_ref` holds the adapter's
 * outcome token (`test-ok` / `test-declined`) so retries are auditable.
 */
@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'attempt_no', type: 'integer', default: 1 })
  attemptNo!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'failed'],
    enumName: 'payment_status',
    default: 'pending',
  })
  status!: PaymentStatus;

  @Column({ type: 'text', default: 'test_adapter' })
  method!: string;

  @Column({ name: 'external_ref', type: 'text', nullable: true })
  externalRef!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
