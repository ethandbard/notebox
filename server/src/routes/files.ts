import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlink } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { db } from '../db/client.js';
import { files } from '../db/schema.js';
import { env } from '../env.js';
import { actingUser, asyncHandler, notFound } from '../http.js';

export const filesRouter = Router();

const uploadDir = resolve(env.uploadDir);
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});

filesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(files).orderBy(desc(files.uploadedAt));
    res.json(rows);
  }),
);

filesRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw notFound('No file uploaded');
    const [row] = await db
      .insert(files)
      .values({
        storedName: req.file.filename,
        originalName: req.file.originalname,
        sizeBytes: req.file.size,
        mimeType: req.file.mimetype || 'application/octet-stream',
        uploadedBy: actingUser(req),
      })
      .returning();
    res.status(201).json(row);
  }),
);

filesRouter.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.select().from(files).where(eq(files.id, id));
    if (!row) throw notFound('File not found');
    const path = join(uploadDir, row.storedName);
    if (!existsSync(path)) throw notFound('File missing on disk');
    res.download(path, row.originalName);
  }),
);

filesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.delete(files).where(eq(files.id, id)).returning();
    if (!row) throw notFound('File not found');
    unlink(join(uploadDir, row.storedName), () => {});
    res.status(204).end();
  }),
);
