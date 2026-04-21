import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { fieldDefinitions, ruleDefinitions, domainEvents } from '@inventory/db/schema';
import {
  CreateFieldDefinitionRequest,
  UpdateFieldDefinitionRequest,
  CreateRuleRequest,
  ActivateRuleRequest,
} from '@inventory/contracts/metadata';
import { NotFoundError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import { db } from '../../infra/db.js';
import { reloadRules } from '../../infra/rulesListener.js';
import { invalidateEnforcerCache } from '../../infra/ruleEnforcer.js';
import { requireAdmin } from '../../middleware/requireRole.js';

export const metadataRouter = Router();

// ---- Audit helper ----

async function writeAudit(
  tenantId: Buffer,
  userId: Buffer,
  eventType: string,
  entityName: string,
  changes?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(domainEvents).values({
      tenantId,
      streamType: 'audit',
      streamId: uuidToBinary(uuidv7()),
      version: 1,
      eventType,
      payload: { userId: binaryToUuid(userId), entityName, changes: changes ?? {} },
      metadata: { source: 'admin' },
    });
  } catch {
    // best-effort — never fail the main operation
  }
}

// ---- Field definitions ----

metadataRouter.get('/fields', async (req, res, next) => {
  try {
    const { entityType, isActive } = req.query as { entityType?: string; isActive?: string };
    const conditions = [eq(fieldDefinitions.tenantId, req.context.tenantId)];
    if (entityType) conditions.push(eq(fieldDefinitions.entityType, entityType));
    if (isActive !== undefined) conditions.push(eq(fieldDefinitions.isActive, isActive === 'true'));

    const rows = await db
      .select()
      .from(fieldDefinitions)
      .where(and(...conditions))
      .orderBy(fieldDefinitions.displayOrder);

    res.json(rows.map(toFieldResponse));
  } catch (err) {
    next(err);
  }
});

metadataRouter.post('/fields', requireAdmin, async (req, res, next) => {
  try {
    const body = CreateFieldDefinitionRequest.parse(req.body);
    const id = uuidToBinary(uuidv7());

    await db.insert(fieldDefinitions).values({
      id,
      tenantId: req.context.tenantId,
      entityType: body.entityType,
      fieldKey: body.fieldKey,
      label: body.label,
      dataType: body.dataType,
      config: (body.config ?? {}) as Record<string, unknown>,
      isRequired: body.isRequired ?? false,
      isIndexed: body.isIndexed ?? false,
      isActive: true,
      displayOrder: body.displayOrder ?? 0,
      section: body.section ?? null,
    });

    const rows = await db
      .select()
      .from(fieldDefinitions)
      .where(eq(fieldDefinitions.id, id))
      .limit(1);

    void writeAudit(req.context.tenantId, req.context.userId, 'field.created', body.fieldKey);

    res.status(201).json(toFieldResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

metadataRouter.patch('/fields/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = uuidToBinary(req.params['id']!);
    const body = UpdateFieldDefinitionRequest.parse(req.body);

    const existing = await db
      .select()
      .from(fieldDefinitions)
      .where(and(eq(fieldDefinitions.id, id), eq(fieldDefinitions.tenantId, req.context.tenantId)))
      .limit(1);
    if (!existing[0]) throw new NotFoundError('FieldDefinition', req.params['id']!);

    const updates: Record<string, unknown> = {};
    if (body.label !== undefined) updates['label'] = body.label;
    if (body.config !== undefined) updates['config'] = body.config;
    if (body.isRequired !== undefined) updates['isRequired'] = body.isRequired;
    if (body.isIndexed !== undefined) updates['isIndexed'] = body.isIndexed;
    if (body.isActive !== undefined) updates['isActive'] = body.isActive;
    if (body.displayOrder !== undefined) updates['displayOrder'] = body.displayOrder;
    if ('section' in body) updates['section'] = body.section ?? null;

    if (Object.keys(updates).length > 0) {
      await db.update(fieldDefinitions).set(updates).where(eq(fieldDefinitions.id, id));
    }

    const rows = await db
      .select()
      .from(fieldDefinitions)
      .where(eq(fieldDefinitions.id, id))
      .limit(1);

    const eventType = body.isActive === false ? 'field.deactivated' : body.isActive === true ? 'field.activated' : 'field.updated';
    void writeAudit(req.context.tenantId, req.context.userId, eventType, existing[0]!.fieldKey, updates);

    res.json(toFieldResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

metadataRouter.delete('/fields/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = uuidToBinary(req.params['id']!);
    const existing = await db
      .select()
      .from(fieldDefinitions)
      .where(and(eq(fieldDefinitions.id, id), eq(fieldDefinitions.tenantId, req.context.tenantId)))
      .limit(1);

    await db
      .update(fieldDefinitions)
      .set({ isActive: false })
      .where(and(eq(fieldDefinitions.id, id), eq(fieldDefinitions.tenantId, req.context.tenantId)));

    if (existing[0]) {
      void writeAudit(req.context.tenantId, req.context.userId, 'field.deactivated', existing[0].fieldKey);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---- Rule definitions ----

metadataRouter.get('/rules', async (req, res, next) => {
  try {
    const { engine } = req.query as { engine?: string };
    const conditions = [eq(ruleDefinitions.tenantId, req.context.tenantId)];
    if (engine) {
      conditions.push(
        eq(
          ruleDefinitions.engine,
          engine as 'validation' | 'decision' | 'reactive' | 'policy',
        ),
      );
    }

    const rows = await db
      .select()
      .from(ruleDefinitions)
      .where(and(...conditions))
      .orderBy(ruleDefinitions.priority);

    res.json(rows.map(toRuleResponse));
  } catch (err) {
    next(err);
  }
});

metadataRouter.post('/rules', requireAdmin, async (req, res, next) => {
  try {
    const body = CreateRuleRequest.parse(req.body);
    const id = uuidToBinary(uuidv7());

    await db.insert(ruleDefinitions).values({
      id,
      tenantId: req.context.tenantId,
      name: body.name,
      description: body.description ?? null,
      engine: body.engine,
      triggerEvent: body.triggerEvent ?? null,
      priority: body.priority ?? 100,
      body: body.body,
      version: 1,
      isActive: false,
      authoredByUserId: req.context.userId,
      authoredFromNaturalLanguage: body.authoredFromNaturalLanguage ?? null,
    });

    const rows = await db
      .select()
      .from(ruleDefinitions)
      .where(eq(ruleDefinitions.id, id))
      .limit(1);

    void writeAudit(req.context.tenantId, req.context.userId, 'rule.created', body.name);

    res.status(201).json(toRuleResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

metadataRouter.post('/rules/:id/activate', requireAdmin, async (req, res, next) => {
  try {
    const id = uuidToBinary(req.params['id']!);
    const existing = await db
      .select()
      .from(ruleDefinitions)
      .where(and(eq(ruleDefinitions.id, id), eq(ruleDefinitions.tenantId, req.context.tenantId)))
      .limit(1);

    if (!existing[0]) throw new NotFoundError('Rule', req.params['id']!);

    await db
      .update(ruleDefinitions)
      .set({ isActive: true, activatedAt: new Date() })
      .where(eq(ruleDefinitions.id, id));

    void writeAudit(req.context.tenantId, req.context.userId, 'rule.activated', existing[0].name);

    await reloadRules();
    invalidateEnforcerCache(req.context.tenantId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

metadataRouter.post('/rules/:id/deactivate', requireAdmin, async (req, res, next) => {
  try {
    const id = uuidToBinary(req.params['id']!);
    const existing = await db
      .select()
      .from(ruleDefinitions)
      .where(and(eq(ruleDefinitions.id, id), eq(ruleDefinitions.tenantId, req.context.tenantId)))
      .limit(1);

    await db
      .update(ruleDefinitions)
      .set({ isActive: false })
      .where(and(eq(ruleDefinitions.id, id), eq(ruleDefinitions.tenantId, req.context.tenantId)));

    if (existing[0]) {
      void writeAudit(req.context.tenantId, req.context.userId, 'rule.deactivated', existing[0].name);
    }

    await reloadRules();
    invalidateEnforcerCache(req.context.tenantId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

function toFieldResponse(row: typeof fieldDefinitions.$inferSelect) {
  return {
    id: binaryToUuid(row.id as Buffer),
    tenantId: binaryToUuid(row.tenantId as Buffer),
    entityType: row.entityType,
    fieldKey: row.fieldKey,
    label: row.label,
    dataType: row.dataType,
    config: row.config as Record<string, unknown>,
    isRequired: row.isRequired,
    isIndexed: row.isIndexed,
    isActive: row.isActive,
    displayOrder: row.displayOrder,
    section: row.section ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toRuleResponse(row: typeof ruleDefinitions.$inferSelect) {
  return {
    id: binaryToUuid(row.id as Buffer),
    tenantId: binaryToUuid(row.tenantId as Buffer),
    name: row.name,
    description: row.description ?? null,
    engine: row.engine,
    triggerEvent: row.triggerEvent ?? null,
    priority: row.priority,
    body: row.body,
    version: row.version,
    isActive: row.isActive,
    authoredFromNaturalLanguage: row.authoredFromNaturalLanguage ?? null,
    createdAt: row.createdAt.toISOString(),
    activatedAt: row.activatedAt?.toISOString() ?? null,
  };
}
