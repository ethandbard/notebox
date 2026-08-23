import { Router } from 'express';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { sections } from '../db/schema.js';
import { asyncHandler, badRequest, notFound } from '../http.js';

export const sectionsRouter = Router();

sectionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(sections).orderBy(asc(sections.position), asc(sections.id));
    res.json(rows);
  }),
);

const createSchema = z.object({ name: z.string().trim().min(1).max(200) });

sectionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const [{ maxPosition }] = await db
      .select({ maxPosition: sql<number>`coalesce(max(${sections.position}), -1)` })
      .from(sections);
    const [row] = await db
      .insert(sections)
      .values({ name: body.name, position: maxPosition + 1 })
      .returning();
    res.status(201).json(row);
  }),
);

const updateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  position: z.number().int().optional(),
});

sectionsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const body = updateSchema.parse(req.body);
    if (Object.keys(body).length === 0) throw badRequest('No fields to update');
    const [row] = await db.update(sections).set(body).where(eq(sections.id, id)).returning();
    if (!row) throw notFound('Section not found');
    res.json(row);
  }),
);

sectionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db.delete(sections).where(eq(sections.id, id)).returning();
    if (!row) throw notFound('Section not found');
    res.status(204).end();
  }),
);
