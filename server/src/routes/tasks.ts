import { Router } from 'express';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { tasks } from '../db/schema.js';
import { actingUser, asyncHandler, badRequest, notFound } from '../http.js';

export const tasksRouter = Router();

const listQuerySchema = z.object({
  done: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { done } = listQuerySchema.parse(req.query);
    const owner = actingUser(req);
    if (done === true) {
      const rows = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.createdBy, owner), eq(tasks.done, true)))
        .orderBy(desc(tasks.completedAt));
      res.json(rows);
      return;
    }
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.createdBy, owner), eq(tasks.done, false)))
      .orderBy(asc(tasks.position), asc(tasks.id));
    res.json(rows);
  }),
);

const createSchema = z.object({ text: z.string().trim().min(1).max(2000) });

tasksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const owner = actingUser(req);
    const [{ maxPosition }] = await db
      .select({ maxPosition: sql<number>`coalesce(max(${tasks.position}), -1)` })
      .from(tasks)
      .where(eq(tasks.createdBy, owner));
    const [row] = await db
      .insert(tasks)
      .values({ text: body.text, position: maxPosition + 1, createdBy: owner })
      .returning();
    res.status(201).json(row);
  }),
);

const updateSchema = z.object({
  text: z.string().trim().min(1).max(2000).optional(),
  position: z.number().int().optional(),
});

tasksRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const body = updateSchema.parse(req.body);
    if (Object.keys(body).length === 0) throw badRequest('No fields to update');
    const [row] = await db
      .update(tasks)
      .set(body)
      .where(and(eq(tasks.id, id), eq(tasks.createdBy, actingUser(req))))
      .returning();
    if (!row) throw notFound('Task not found');
    res.json(row);
  }),
);

tasksRouter.patch(
  '/:id/toggle',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const owner = actingUser(req);
    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.createdBy, owner)));
    if (!existing) throw notFound('Task not found');
    const nextDone = !existing.done;
    const [row] = await db
      .update(tasks)
      .set({ done: nextDone, completedAt: nextDone ? new Date().toISOString() : null })
      .where(and(eq(tasks.id, id), eq(tasks.createdBy, owner)))
      .returning();
    res.json(row);
  }),
);

tasksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.createdBy, actingUser(req))))
      .returning();
    if (!row) throw notFound('Task not found');
    res.status(204).end();
  }),
);
