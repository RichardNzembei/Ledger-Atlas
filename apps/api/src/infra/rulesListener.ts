import { and, eq } from 'drizzle-orm';
import { ruleDefinitions } from '@inventory/db/schema';
import { RuleRegistry, ReactiveRuleEvaluator, RuleDefinitionSchema } from '@inventory/rules';
import { binaryToUuid } from '@inventory/domain/utils';
import { db } from './db.js';
import { eventBus } from './eventBus.js';
import { logger } from './logger.js';

const registry = new RuleRegistry();
registry.register(new ReactiveRuleEvaluator());

// tenantId (hex) → triggerEvent → compiled rule list
type TenantRuleMap = Map<string, Map<string, RuleDefinitionSchema[]>>;
let ruleMap: TenantRuleMap = new Map();
let unsubscribe: (() => void) | null = null;

export async function startRulesListener() {
  await reload();

  // Re-subscribe to all trigger events found in the current rule map
  rebindSubscriptions();

  logger.info('[rules] reactive rules listener started');
}

export async function reloadRules() {
  await reload();
  rebindSubscriptions();
  logger.info('[rules] rules reloaded');
}

async function reload() {
  const rows = await db
    .select()
    .from(ruleDefinitions)
    .where(and(eq(ruleDefinitions.engine, 'reactive'), eq(ruleDefinitions.isActive, true)));

  const next: TenantRuleMap = new Map();
  for (const row of rows) {
    const tenantId = binaryToUuid(row.tenantId as Buffer);
    const triggerEvent = row.triggerEvent ?? '*';

    if (!next.has(tenantId)) next.set(tenantId, new Map());
    const byEvent = next.get(tenantId)!;
    if (!byEvent.has(triggerEvent)) byEvent.set(triggerEvent, []);

    const parsed = RuleDefinitionSchema.safeParse({
      id: binaryToUuid(row.id as Buffer),
      tenantId,
      name: row.name,
      description: row.description ?? undefined,
      engine: row.engine,
      triggerEvent: row.triggerEvent ?? undefined,
      priority: row.priority,
      body: row.body,
      version: row.version,
      isActive: row.isActive,
    });

    if (parsed.success) {
      byEvent.get(triggerEvent)!.push(parsed.data);
    } else {
      logger.warn({ ruleId: binaryToUuid(row.id as Buffer), err: parsed.error }, '[rules] skipping malformed rule');
    }
  }

  // Sort each list by priority ascending (lower number = higher priority)
  for (const byEvent of next.values()) {
    for (const [evt, list] of byEvent) {
      byEvent.set(evt, list.sort((a, b) => a.priority - b.priority));
    }
  }

  ruleMap = next;
}

function rebindSubscriptions() {
  // Drop old wildcard subscription
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  // A single wildcard handler — cheaper than N subscriptions when rules change often
  unsubscribe = eventBus.subscribeAll(async (event) => {
    for (const [tenantIdHex, byEvent] of ruleMap) {
      // Match tenant: event.tenantId is a Buffer
      const eventTenantId = binaryToUuid(event.tenantId as Buffer);
      if (eventTenantId !== tenantIdHex) continue;

      const candidates = [
        ...(byEvent.get(event.type) ?? []),
        ...(byEvent.get('*') ?? []),
      ];

      for (const rule of candidates) {
        try {
          const input: Record<string, unknown> = {
            eventType: event.type,
            payload: event.payload,
            metadata: event.metadata,
            occurredAt: event.occurredAt.toISOString(),
          };

          const start = Date.now();
          const { output } = await registry.evaluate(rule, input);
          const durationMs = Date.now() - start;

          logger.info(
            { ruleId: rule.id, ruleName: rule.name, eventType: event.type, output, durationMs },
            '[rules] rule evaluated',
          );
        } catch (err) {
          logger.error(
            { ruleId: rule.id, ruleName: rule.name, eventType: event.type, err },
            '[rules] rule evaluation failed',
          );
        }
      }
    }
  });
}
