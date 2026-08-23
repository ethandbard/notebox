import express from 'express';
import cors from 'cors';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { env } from './env.js';
import { db } from './db/client.js';
import { errorHandler, asyncHandler } from './http.js';
import { sectionsRouter } from './routes/sections.js';
import { notesRouter } from './routes/notes.js';
import { tasksRouter } from './routes/tasks.js';
import { filesRouter } from './routes/files.js';

const here = dirname(fileURLToPath(import.meta.url));

// SQLite migrations have no separate container or startup ordering to race,
// so running them here (rather than as a manual post-deploy step) keeps
// deployment to a single "build and start" with nothing else to remember.
await migrate(db, { migrationsFolder: resolve(here, '../drizzle') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  }),
);

app.use('/api/sections', sectionsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/files', filesRouter);

// In production the client is built into ../client/dist relative to this
// file's compiled location (server/dist/index.js). Serving it here keeps
// the app to a single container with no separate reverse proxy.
if (process.env.NODE_ENV === 'production') {
  const clientDist = resolve(here, '../../client/dist');
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[notebox] listening on http://0.0.0.0:${env.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[notebox] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
