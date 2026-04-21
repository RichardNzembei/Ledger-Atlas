import { Router } from 'express';
import { and, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { locations } from '@inventory/db/schema';
import { NotFoundError, ConflictError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import { db } from '../../infra/db.js';
import { requireRole } from '../../middleware/requireRole.js';

export const locationsRouter: Router = Router();

const CreateLocationRequest = z.object({
  code: z.string().min(1).max(50).trim(),
  name: z.string().min(1).max(255).trim(),
  type: z.enum(['warehouse', 'store', 'bin', 'virtual']).default('store'),
  parentId: z.string().uuid().optional(),
  address: z.string().max(1000).optional(),
});

const UpdateLocationRequest = CreateLocationRequest.partial().omit({ code: true });

locationsRouter.get('/', async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(locations)
      .where(eq(locations.tenantId, req.context.tenantId))
      .orderBy(locations.name);
    res.json(rows.map(toResponse));
  } catch (err) {
    next(err);
  }
});

locationsRouter.post('/', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const body = CreateLocationRequest.parse(req.body);
    const id = uuidToBinary(uuidv7());
    const parentId = body.parentId ? uuidToBinary(body.parentId) : null;

    await db.insert(locations).values({
      id,
      tenantId: req.context.tenantId,
      parentId,
      code: body.code,
      name: body.name,
      type: body.type ?? 'store',
      address: body.address ?? null,
      isActive: true,
    });

    const rows = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    res.status(201).json(toResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

locationsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = uuidToBinary((req.params['id'] as string));
    const rows = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, id), eq(locations.tenantId, req.context.tenantId)))
      .limit(1);
    if (!rows[0]) throw new NotFoundError('Location', (req.params['id'] as string));
    res.json(toResponse(rows[0]));
  } catch (err) {
    next(err);
  }
});

locationsRouter.patch('/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const id = uuidToBinary((req.params['id'] as string));
    const body = UpdateLocationRequest.parse(req.body);

    const existing = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, id), eq(locations.tenantId, req.context.tenantId)))
      .limit(1);
    if (!existing[0]) throw new NotFoundError('Location', (req.params['id'] as string));

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates['name'] = body.name;
    if (body.type !== undefined) updates['type'] = body.type;
    if (body.address !== undefined) updates['address'] = body.address;
    if (body.parentId !== undefined) updates['parentId'] = uuidToBinary(body.parentId);

    if (Object.keys(updates).length > 0) {
      await db.update(locations).set(updates).where(eq(locations.id, id));
    }

    const rows = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, id), eq(locations.tenantId, req.context.tenantId)))
      .limit(1);
    res.json(toResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

locationsRouter.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const id = uuidToBinary((req.params['id'] as string));
    await db
      .update(locations)
      .set({ isActive: false })
      .where(and(eq(locations.id, id), eq(locations.tenantId, req.context.tenantId)));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

function toResponse(row: typeof locations.$inferSelect) {
  return {
    id: binaryToUuid(row.id as Buffer),
    tenantId: binaryToUuid(row.tenantId as Buffer),
    parentId: row.parentId ? binaryToUuid(row.parentId as Buffer) : null,
    code: row.code,
    name: row.name,
    type: row.type,
    address: row.address ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
