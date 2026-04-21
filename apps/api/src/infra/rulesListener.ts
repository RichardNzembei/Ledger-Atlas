import { and, eq } from 'drizzle-orm';
import { ruleDefinitions } from '@inventory/db/schema';
import {
  RuleRegistry,
  ReactiveRuleEvaluator,
  DecisionTableEvaluator,
  ValidationRuleEvaluator,
  PolicyRuleEvaluator,
  RuleDefinitionSchema,
} from '@inventory/rules';
import { binaryToUuid } from '@inventory/domain/utils';
import { db } from './db.js';
import { eventBus } from './eventBus.js';
import { logger } from './logger.js';
import { settingsService } from '../modules/settings/settings.service.js';
import { dispatchActions } from './ruleActionDispatcher.js';
import { invalidateEnforcerCache } from './ruleEnforcer.js';

const registry = new RuleRegistry();
registry.register(new ReactiveRuleEvaluator());
registry.register(new DecisionTableEvaluator());
registry.register(new ValidationRuleEvaluator());
registry.register(new PolicyRuleEvaluator());

// tenantId hex → triggerEvent → compiled reactive rule list
type TenantRuleMap = Map<string, Map<string, RuleDefinitionSchema[]>>;
let ruleMap: TenantRuleMap = new Map();
let unsubscribe: (() => void) | null = null;

// Per-tenant settings cache (60s TTL) for reactive rule evaluation
const settingsCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const SETTINGS_TTL_MS = 60_000;

async function getSettings(tenantId: Buffer): Promise<Record<string, unknown>> {
  const key = tenantId.toString('hex');
  const cached = settingsCache.get(key);
  if (cached && Date.now() - cached.ts < SETTINGS_TTL_MS) return cached.data;
  const data = await settingsService.resolve(tenantId, {});
  settingsCache.set(key, { data, ts: Date.now() });
  return data;
}

// Flatten a nested object into dot-separated keys so json-rules-engine can resolve them
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

export async function startRulesListener() {
  await reload();
  rebindSubscriptions();
  logger.info('[rules] rules listener started');
}

export async function reloadRules() {
  await reload();
  rebindSubscriptions();
  settingsCache.clear();
  invalidateEnforcerCache();
  logger.info('[rules] rules reloaded');
}

async function reload() {
  const rows = await db
    .select()
    .from(ruleDefinitions)
    .where(and(eq(ruleDefinitions.engine, 'reactive'), eq(ruleDefinitions.isActive, true)));

  const next: TenantRuleMap = new Map();
  for (const row of rows) {
    const tenantId = binaryToUuid(row.tenantId as unknown as Buffer);
    const triggerEvent = row.triggerEvent ?? '*';

    if (!next.has(tenantId)) next.set(tenantId, new Map());
    const byEvent = next.get(tenantId)!;
    if (!byEvent.has(triggerEvent)) byEvent.set(triggerEvent, []);

    const parsed = RuleDefinitionSchema.safeParse({
      id: binaryToUuid(row.id as unknown as Buffer),
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
      logger.warn({ ruleId: binaryToUuid(row.id as unknown as Buffer), err: parsed.error }, '[rules] skipping malformed rule');
    }
  }

  for (const byEvent of next.values()) {
    for (const [evt, list] of byEvent) {
      byEvent.set(evt, list.sort((a, b) => a.priority - b.priority));
    }
  }

  ruleMap = next;
}

function rebindSubscriptions() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  unsubscribe = eventBus.subscribeAll(async (event) => {
    const eventTenantId = binaryToUuid(event.tenantId as unknown as Buffer);
    const byEvent = ruleMap.get(eventTenantId);
    if (!byEvent) return;

    const candidates = [
      ...(byEvent.get(event.type) ?? []),
      ...(byEvent.get('*') ?? []),
    ];
    if (candidates.length === 0) return;

    // Load and flatten settings for this tenant
    const settings = await getSettings(event.tenantId as unknown as Buffer);
    const settingFacts: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(settings)) {
      settingFacts[`setting.${k}`] = v;
    }

    // Flatten the event payload so fact paths like 'sale.total' resolve
    const payloadFacts = flatten(event.payload as Record<string, unknown>);

    const facts: Record<string, unknown> = {
      ...payloadFacts,
      ...settingFacts,
      eventType: event.type,
      occurredAt: event.occurredAt.toISOString(),
    };

    for (const rule of candidates) {
      try {
        const start = Date.now();
        const { output } = await registry.evaluate(rule, facts);
        const durationMs = Date.now() - start;
        const { fired, actions } = output as { fired: boolean; actions: Array<Record<string, unknown>> };

        logger.info(
          { ruleId: rule.id, ruleName: rule.name, eventType: event.type, fired, actionCount: actions.length, durationMs },
          '[rules] reactive rule evaluated',
        );

        if (fired && actions.length > 0) {
          await dispatchActions(actions, {
            tenantId: event.tenantId as unknown as Buffer,
            facts,
            rule,
          });
        }
      } catch (err) {
        logger.error(
          { ruleId: rule.id, ruleName: rule.name, eventType: event.type, err },
          '[rules] reactive rule evaluation failed',
        );
      }
    }
  });
}
