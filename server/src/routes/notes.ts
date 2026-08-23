import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { notes } from '../db/schema.js';
import { actingUser, asyncHandler, badRequest, notFound } from '../http.js';

export const notesRouter = Router();

const listQuerySchema = z.object({
  sectionId: z.coerce.number().int().optional(),
});

notesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { sectionId } = listQuerySchema.parse(req.query);
    const rows = sectionId
      ? await db.select().from(notes).where(eq(notes.sectionId, sectionId)).orderBy(desc(notes.updatedAt))
      : await db.select().from(notes).orderBy(desc(notes.updatedAt));
    res.json(rows);
  }),
);

notesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.select().from(notes).where(eq(notes.id, id));
    if (!row) throw notFound('Note not found');
    res.json(row);
  }),
);

const createSchema = z.object({
  sectionId: z.number().int(),
  title: z.string().trim().min(1).max(300),
  bodyMarkdown: z.string().max(200_000).optional(),
});

notesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const [row] = await db
      .insert(notes)
      .values({
        sectionId: body.sectionId,
        title: body.title,
        bodyMarkdown: body.bodyMarkdown ?? '',
        createdBy: actingUser(req),
      })
      .returning();
    res.status(201).json(row);
  }),
);

const updateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  bodyMarkdown: z.string().max(200_000).optional(),
  sectionId: z.number().int().optional(),
});

notesRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const body = updateSchema.parse(req.body);
    if (Object.keys(body).length === 0) throw badRequest('No fields to update');
    const [row] = await db
      .update(notes)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(notes.id, id))
      .returning();
    if (!row) throw notFound('Note not found');
    res.json(row);
  }),
);

notesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.delete(notes).where(eq(notes.id, id)).returning();
    if (!row) throw notFound('Note not found');
    res.status(204).end();
  }),
);
