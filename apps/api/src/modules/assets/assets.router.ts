import { Router } from 'express';
import { and, count, eq, sql } from 'drizzle-orm';
import { assets, assetExtensions, locations } from '@inventory/db/schema';
import { CreateAssetRequest, UpdateAssetRequest, AssetListQuery, AssignAssetRequest } from '@inventory/contracts/assets';
import { NotFoundError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import { db } from '../../infra/db.js';
import { eventBus } from '../../infra/eventBus.js';
import { EventTypes } from '@inventory/events';
import { requireRole } from '../../middleware/requireRole.js';

export const assetsRouter: Router = Router();

assetsRouter.get('/', async (req, res, next) => {
  try {
    const query = AssetListQuery.parse(req.query);
    const tenantId = req.context.tenantId;

    const conditions = [eq(assets.tenantId, tenantId)];
    if (query.search)
      conditions.push(
        sql`(${assets.name} LIKE ${`%${query.search}%`} OR ${assets.assetTag} LIKE ${`%${query.search}%`})`,
      );
    if (query.category) conditions.push(eq(assets.category, query.category));
    if (query.status) conditions.push(eq(assets.status, query.status));
    if (query.locationId) conditions.push(eq(assets.locationId, uuidToBinary(query.locationId)));

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      db
        .select()
        .from(assets)
        .leftJoin(assetExtensions, eq(assets.id, assetExtensions.assetId))
        .where(where)
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: count() }).from(assets).where(where),
    ]);

    res.json({
      items: rows.map((r) => toResponse(r)),
      total: Number(countRow?.count ?? 0),
      limit: query.limit,
      offset: query.offset,
    });
  } catch (err) {
    next(err);
  }
});

assetsRouter.post('/', requireRole('admin', 'manager', 'asset_manager'), async (req, res, next) => {
  try {
    const body = CreateAssetRequest.parse(req.body);
    const tenantId = req.context.tenantId;
    const id = uuidToBinary(uuidv7());
    const locationId = body.locationId ? uuidToBinary(body.locationId) : null;

    await db.transaction(async (tx) => {
      await tx.insert(assets).values({
        id,
        tenantId,
        assetTag: body.assetTag,
        name: body.name,
        description: body.description ?? null,
        category: body.category ?? null,
        status: 'active',
        lifecycleStage: 'acquired',
        locationId,
        assignedToUserId: null,
        acquiredAt: body.acquiredAt ?? null,
        acquisitionCost: String(body.acquisitionCost ?? 0),
        bookValue: String(body.acquisitionCost ?? 0),
        depreciationMethod: body.depreciationMethod ?? 'straight_line',
        usefulLifeMonths: body.usefulLifeMonths ?? null,
        salvageValue: String(body.salvageValue ?? 0),
        serialNumber: body.serialNumber ?? null,
        notes: body.notes ?? null,
      });
      await tx.insert(assetExtensions).values({
        assetId: id,
        tenantId,
        custom: body.customFields ?? {},
      });
    });

    const rows = await db
      .select()
      .from(assets)
      .leftJoin(assetExtensions, eq(assets.id, assetExtensions.assetId))
      .where(eq(assets.id, id))
      .limit(1);

    eventBus.publish({
      type: EventTypes.ASSET_CREATED,
      tenantId,
      payload: { assetId: binaryToUuid(id), assetTag: body.assetTag },
      metadata: { userId: req.context.userId },
      occurredAt: new Date(),
    });

    res.status(201).json(toResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

assetsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = uuidToBinary((req.params['id'] as string));
    const rows = await db
      .select()
      .from(assets)
      .leftJoin(assetExtensions, eq(assets.id, assetExtensions.assetId))
      .where(and(eq(assets.id, id), eq(assets.tenantId, req.context.tenantId)))
      .limit(1);
    if (!rows[0]) throw new NotFoundError('Asset', (req.params['id'] as string));
    res.json(toResponse(rows[0]));
  } catch (err) {
    next(err);
  }
});

assetsRouter.patch('/:id', requireRole('admin', 'manager', 'asset_manager'), async (req, res, next) => {
  try {
    const id = uuidToBinary((req.params['id'] as string));
    const tenantId = req.context.tenantId;
    const body = UpdateAssetRequest.parse(req.body);

    const existing = await db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)))
      .limit(1);
    if (!existing[0]) throw new NotFoundError('Asset', (req.params['id'] as string));

    await db.transaction(async (tx) => {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates['name'] = body.name;
      if (body.description !== undefined) updates['description'] = body.description;
      if (body.category !== undefined) updates['category'] = body.category;
      if (body.locationId !== undefined)
        updates['locationId'] = body.locationId ? uuidToBinary(body.locationId) : null;
      if (body.acquiredAt !== undefined) updates['acquiredAt'] = body.acquiredAt;
      if (body.acquisitionCost !== undefined)
        updates['acquisitionCost'] = String(body.acquisitionCost);
      if (body.depreciationMethod !== undefined)
        updates['depreciationMethod'] = body.depreciationMethod;
      if (body.usefulLifeMonths !== undefined) updates['usefulLifeMonths'] = body.usefulLifeMonths;
      if (body.salvageValue !== undefined) updates['salvageValue'] = String(body.salvageValue);
      if (body.serialNumber !== undefined) updates['serialNumber'] = body.serialNumber;
      if (body.notes !== undefined) updates['notes'] = body.notes;

      if (Object.keys(updates).length > 0)
        await tx.update(assets).set(updates).where(eq(assets.id, id));
      if (body.customFields !== undefined)
        await tx
          .update(assetExtensions)
          .set({ custom: body.customFields })
          .where(eq(assetExtensions.assetId, id));
    });

    const rows = await db
      .select()
      .from(assets)
      .leftJoin(assetExtensions, eq(assets.id, assetExtensions.assetId))
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)))
      .limit(1);
    res.json(toResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

assetsRouter.post('/:id/assign', requireRole('admin', 'manager', 'asset_manager'), async (req, res, next) => {
  try {
    const id = uuidToBinary((req.params['id'] as string));
    const tenantId = req.context.tenantId;
    const body = AssignAssetRequest.parse(req.body);

    const existing = await db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)))
      .limit(1);
    if (!existing[0]) throw new NotFoundError('Asset', (req.params['id'] as string));

    await db.update(assets).set({
      assignedToUserId: uuidToBinary(body.userId),
      locationId: body.locationId ? uuidToBinary(body.locationId) : undefined,
      lifecycleStage: 'assigned',
    }).where(eq(assets.id, id));

    eventBus.publish({
      type: EventTypes.ASSET_ASSIGNED,
      tenantId,
      payload: { assetId: req.params['id'], userId: body.userId },
      metadata: { userId: req.context.userId },
      occurredAt: new Date(),
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

function toResponse(row: {
  assets: typeof assets.$inferSelect;
  asset_extensions: typeof assetExtensions.$inferSelect | null;
}) {
  const a = row.assets;
  const ext = row.asset_extensions;
  return {
    id: binaryToUuid(a.id as Buffer),
    tenantId: binaryToUuid(a.tenantId as Buffer),
    assetTag: a.assetTag,
    name: a.name,
    description: a.description ?? null,
    category: a.category ?? null,
    status: a.status,
    lifecycleStage: a.lifecycleStage,
    locationId: a.locationId ? binaryToUuid(a.locationId as Buffer) : null,
    assignedToUserId: a.assignedToUserId ? binaryToUuid(a.assignedToUserId as Buffer) : null,
    acquiredAt: a.acquiredAt ?? null,
    acquisitionCost: Number(a.acquisitionCost),
    bookValue: Number(a.bookValue),
    depreciationMethod: a.depreciationMethod,
    usefulLifeMonths: a.usefulLifeMonths ?? null,
    salvageValue: Number(a.salvageValue),
    serialNumber: a.serialNumber ?? null,
    notes: a.notes ?? null,
    customFields: (ext?.custom as Record<string, unknown>) ?? {},
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
