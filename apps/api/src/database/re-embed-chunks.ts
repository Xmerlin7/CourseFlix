import { ConfigService } from '@nestjs/config';
import AppDataSource from './data-source';
import { OpenAIEmbeddingProvider } from '../modules/retrieval/embedding.adapter';
import { toVectorLiteral } from '../modules/retrieval/retrieval.service';

interface DocumentChunkRow {
  vector_id: string;
  text_content: string | null;
  text_preview: string;
}

/**
 * Regenerates embeddings for every active document chunk and writes them
 * back onto the chunk's Postgres row (pgvector). Replaces the old
 * ChromaDB re-embed script — the vector store now lives in Postgres.
 */
export async function reEmbedDocumentChunks(): Promise<number> {
  const isInitialized = AppDataSource.isInitialized;
  if (!isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    const configService = new ConfigService();
    const embeddingProvider = new OpenAIEmbeddingProvider(configService);

    const chunks = (await AppDataSource.query(
      `SELECT vector_id, text_content, text_preview
         FROM document_chunks
        WHERE is_active = true`,
    )) as DocumentChunkRow[];

    if (chunks.length === 0) {
      console.log('No active document chunks found to re-embed.');
      return 0;
    }

    console.log(
      `Re-embedding ${chunks.length} document chunks using OpenAI embeddings...`,
    );

    const BATCH_SIZE = 20;
    let processed = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.text_content || c.text_preview);

      const embeddings = await embeddingProvider.embed(texts);

      for (let j = 0; j < batch.length; j++) {
        await AppDataSource.query(
          `UPDATE document_chunks
              SET embedding = $1::vector,
                  text_content = COALESCE(text_content, text_preview)
            WHERE vector_id = $2`,
          [toVectorLiteral(embeddings[j]), batch[j].vector_id],
        );
      }

      processed += batch.length;
      console.log(`Processed ${processed}/${chunks.length} chunks...`);
    }

    console.log(
      `Successfully re-embedded ${processed} document chunks in Postgres.`,
    );
    return processed;
  } finally {
    if (!isInitialized && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  reEmbedDocumentChunks()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Re-embedding failed:', err);
      process.exit(1);
    });
}
