import { config } from 'dotenv';
import { resolve } from 'path';

// Jest runs test files directly (not through main.ts or data-source.ts),
// so the root .env is never loaded unless we do it explicitly here.
//
// Tests must always run in "email not configured" mode so the devCode is
// returned in API responses, and so the suite never fires real SMTP sends
// through a developer's own Gmail account — regardless of what credentials
// they have set in their local .env. dotenv won't override an env var
// that's already set.
process.env.SMTP_USER = 'replace-me';
process.env.SMTP_PASSWORD = 'replace-me';
process.env.NODE_ENV = 'test';
config({ path: resolve(process.cwd(), '../../.env') });
