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
  logging: process.env.NODE_ENV === 'development',
});

export default AppDataSource;