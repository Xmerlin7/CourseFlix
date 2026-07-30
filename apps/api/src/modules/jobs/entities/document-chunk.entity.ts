import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Mirrors the `document_chunks` table in `schemaV2.sql`.
 *
 * Stores metadata for indexed document chunks.
 * The full chunk text and embeddings live in ChromaDB.
 */
@Entity({ name: 'document_chunks' })
export class DocumentChunkEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'document_id', type: 'uuid' })
    documentId!: string;

    @Column({ name: 'chunk_index', type: 'integer' })
    chunkIndex!: number;

    @Column({
        name: 'text_preview',
        type: 'text',
        nullable: true,
    })
    textPreview!: string | null;

    @Column({ name: 'vector_id', type: 'text' })
    vectorId!: string;

    @Column({
        name: 'page_number',
        type: 'integer',
        nullable: true,
    })
    pageNumber!: number | null;

    @Column({
        name: 'token_count',
        type: 'integer',
        nullable: true,
    })
    tokenCount!: number | null;

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
    })
    isActive!: boolean;

    @Column({
        name: 'deleted_at',
        type: 'timestamptz',
        nullable: true,
    })
    deletedAt!: Date | null;

}