import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** One row per (thread, user) — presence of a row means "marked helpful". */
@Entity({ name: 'discussion_helpful_votes' })
export class DiscussionHelpfulVoteEntity {
  @PrimaryColumn({ name: 'thread_id', type: 'uuid' })
  threadId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
