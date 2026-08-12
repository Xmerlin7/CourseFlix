import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Junction to the shared `files` table — same shape as `post_attachments`. */
@Entity({ name: 'discussion_thread_attachments' })
export class DiscussionThreadAttachmentEntity {
  @PrimaryColumn({ name: 'thread_id', type: 'uuid' })
  threadId!: string;

  @PrimaryColumn({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  orderIndex!: number;
}
