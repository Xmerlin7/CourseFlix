import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'platform_settings' })
export class PlatformSettingEntity {
  @PrimaryColumn({ type: 'text' })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
