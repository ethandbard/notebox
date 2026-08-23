import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { notes, sections } from '../db/schema.js';
import { actingUser, asyncHandler, badRequest, notFound } from '../http.js';

export const notesRouter = Router();

// A note's `createdBy` is always its parent section's owner — enforced here,
// since a user can only ever target a section they own.
async function assertOwnSection(sectionId: number, owner: string): Promise<void> {
  const [section] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.owner, owner)));
  if (!section) throw badRequest('Unknown section');
}

const listQuerySchema = z.object({
  sectionId: z.coerce.number().int().optional(),
});

notesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { sectionId } = listQuerySchema.parse(req.query);
    const owner = actingUser(req);
    const conditions = sectionId
      ? and(eq(notes.createdBy, owner), eq(notes.sectionId, sectionId))
      : eq(notes.createdBy, owner);
    const rows = await db.select().from(notes).where(conditions).orderBy(desc(notes.updatedAt));
    res.json(rows);
  }),
);

notesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.createdBy, actingUser(req))));
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
    const owner = actingUser(req);
    await assertOwnSection(body.sectionId, owner);
    const [row] = await db
      .insert(notes)
      .values({
        sectionId: body.sectionId,
        title: body.title,
        bodyMarkdown: body.bodyMarkdown ?? '',
        createdBy: owner,
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
    const owner = actingUser(req);
    if (body.sectionId !== undefined) await assertOwnSection(body.sectionId, owner);
    const [row] = await db
      .update(notes)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(and(eq(notes.id, id), eq(notes.createdBy, owner)))
      .returning();
    if (!row) throw notFound('Note not found');
    res.json(row);
  }),
);

notesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.createdBy, actingUser(req))))
      .returning();
    if (!row) throw notFound('Note not found');
    res.status(204).end();
  }),
);
