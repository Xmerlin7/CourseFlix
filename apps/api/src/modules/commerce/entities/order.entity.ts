import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type OrderStatus = 'pending' | 'paid' | 'failed';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

/**
 * Mirrors the `orders` table created in migration
 * `1785000070000-CreateOrdersAndOrderItems.ts`.
 *
 * Plain UUID columns instead of `@ManyToOne` relations, for the same
 * reason as `EnrollmentEntity`: callers resolve related rows (course
 * titles, student profiles) through bulk lookups, avoiding module import
 * cycles. The order response carries the course title snapshot from
 * `order_items`, so no relation is needed for the common read path.
 *
 * `status` is the purchase lifecycle, `paymentStatus` the latest payment
 * attempt — see the migration docblock for the exact semantics.
 */
@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'failed'],
    enumName: 'order_status',
    default: 'pending',
  })
  status!: OrderStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['pending', 'paid', 'failed'],
    enumName: 'payment_status',
    default: 'pending',
  })
  paymentStatus!: PaymentStatus;

  @Column({ type: 'text', default: 'EGP' })
  currency!: string;

  @Column({ name: 'total_minor', type: 'integer' })
  totalMinor!: number;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;
}
