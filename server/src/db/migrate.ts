import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { client, db } from './client.js';

const here = dirname(fileURLToPath(import.meta.url));

await migrate(db, { migrationsFolder: resolve(here, '../../drizzle') });
console.log('[db] migrations applied');
client.close();
