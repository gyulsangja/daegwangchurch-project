import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true });
// Preserve the existing local database setup during migration.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
