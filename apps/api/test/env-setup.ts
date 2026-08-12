import { config } from 'dotenv';
import { resolve } from 'path';

// Jest runs test files directly (not through main.ts or data-source.ts),
// so the root .env is never loaded unless we do it explicitly here.
//
// Tests must always run in "email not configured" mode so the devCode is
// returned in API responses — regardless of what key the developer has set in
// their local .env. dotenv won't override an env var that's already set.
process.env.RESEND_API_KEY = 'replace-me';
process.env.NODE_ENV = 'test';
config({ path: resolve(process.cwd(), '../../.env') });
