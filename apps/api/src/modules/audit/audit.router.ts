import { Router } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { domainEvents } from '@inventory/db/schema';
import { db } from '../../infra/db.js';

export const auditRouter: Router = Router();

const AUDIT_TYPES = [
  'field.created', 'field.updated', 'field.activated', 'field.deactivated',
  'rule.created', 'rule.activated', 'rule.deactivated',
  'setting.upserted',
];

auditRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(
      parseInt((req.query as { limit?: string })['limit'] ?? '100', 10),
      500,
    );

    const rows = await db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.tenantId, req.context.tenantId),
          inArray(domainEvents.eventType, AUDIT_TYPES),
        ),
      )
      .orderBy(desc(domainEvents.occurredAt))
      .limit(limit);

    res.json(
      rows.map((r) => ({
        id: r.id.toString(),
        eventType: r.eventType,
        payload: r.payload,
        occurredAt: r.occurredAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});

auditRouter.get('/rule-log', async (req, res, next) => {
  try {
    const limit = Math.min(
      parseInt((req.query as { limit?: string })['limit'] ?? '200', 10),
      500,
    );

    const rows = await db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.tenantId, req.context.tenantId),
          eq(domainEvents.eventType, 'rule.evaluated'),
        ),
      )
      .orderBy(desc(domainEvents.occurredAt))
      .limit(limit);

    res.json(
      rows.map((r) => ({
        id: r.id.toString(),
        payload: r.payload,
        occurredAt: r.occurredAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});

auditRouter.get('/rule-log/:id', async (req, res, next) => {
  try {
    const ruleId = req.params['id']!;

    const rows = await db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.tenantId, req.context.tenantId),
          eq(domainEvents.eventType, 'rule.evaluated'),
        ),
      )
      .orderBy(desc(domainEvents.occurredAt))
      .limit(500);

    const filtered = rows
      .filter((r) => (r.payload as Record<string, unknown>)['ruleId'] === ruleId)
      .slice(0, 100);

    res.json(
      filtered.map((r) => ({
        id: r.id.toString(),
        payload: r.payload,
        occurredAt: r.occurredAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});
