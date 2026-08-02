import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chat_message_source_chunks' })
export class ChatMessageSourceChunkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'message_id', type: 'uuid' })
  messageId!: string;

  @Column({ name: 'chunk_id', type: 'uuid' })
  chunkId!: string;

  @Column({
    name: 'relevance_score',
    type: 'numeric',
    precision: 5,
    scale: 4,
    nullable: true,
  })
  relevanceScore!: string | null;

  @Column({ type: 'text', nullable: true })
  excerpt!: string | null;

  @Column({ name: 'vector_id', type: 'text', nullable: true })
  vectorId!: string | null;
}
