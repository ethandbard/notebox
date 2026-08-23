import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '../env.js';
import * as schema from './schema.js';

mkdirSync(dirname(env.dbPath), { recursive: true });

export const client = createClient({ url: `file:${resolve(env.dbPath)}` });
await client.execute('PRAGMA foreign_keys = ON');

export const db = drizzle(client, { schema });
