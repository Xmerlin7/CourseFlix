import { config } from 'dotenv';
import { resolve } from 'path';

// Jest runs test files directly (not through main.ts or data-source.ts),
// so the root .env is never loaded unless we do it explicitly here.
config({ path: resolve(process.cwd(), '../../.env') });