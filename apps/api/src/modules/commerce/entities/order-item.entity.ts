import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Mirrors the `order_items` table created in migration
 * `1785000070000-CreateOrdersAndOrderItems.ts`.
 *
 * `titleSnapshot` / `priceMinor` are frozen at purchase time so a paid
 * order keeps the price the student was actually charged even if the
 * course is renamed or repriced later — sales history is immutable.
 */
@Entity({ name: 'order_items' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ name: 'title_snapshot', type: 'text' })
  titleSnapshot!: string;

  @Column({ name: 'price_minor', type: 'integer' })
  priceMinor!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
