import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

// The single .env file lives at the repo root (same place docker-compose
// reads it from), not inside apps/api — resolve it explicitly instead of
// relying on dotenv's cwd-relative default lookup.
config({ path: resolve(process.cwd(), '../../.env') });

/**
 * Standalone TypeORM DataSource used only by the TypeORM CLI
 * (npm run migration:generate / migration:run / migration:revert).
 *
 * The NestJS runtime connection is configured separately in
 * `app.module.ts` via `TypeOrmModule.forRoot(...)`.
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  // Each migration commits in its own transaction. The default ('all') runs
  // every pending migration in a single transaction, which breaks
  // `ALTER TYPE ... ADD VALUE` migrations: Postgres forbids referencing a
  // freshly added enum value until the transaction that added it commits
  // (error 55P04), so the ADD VALUE must be committed before a later
  // migration can read the new value.
  migrationsTransactionMode: 'each',
  logging: process.env.NODE_ENV === 'development',
});

export default AppDataSource;
