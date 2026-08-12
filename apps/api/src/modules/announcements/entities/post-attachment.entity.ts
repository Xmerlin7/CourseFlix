import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'post_attachments' })
export class PostAttachmentEntity {
  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @PrimaryColumn({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  orderIndex!: number;
}
