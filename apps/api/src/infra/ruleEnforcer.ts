import { and, eq } from 'drizzle-orm';
import { ruleDefinitions, domainEvents } from '@inventory/db/schema';
import {
  RuleRegistry,
  ValidationRuleEvaluator,
  PolicyRuleEvaluator,
  DecisionTableEvaluator,
  RuleDefinitionSchema,
} from '@inventory/rules';
import type { ValidationOutput, PolicyOutput, DecisionOutput } from '@inventory/rules';
import { binaryToUuid, uuidv7, uuidToBinary } from '@inventory/domain/utils';
import { db } from './db.js';
import { settingsService } from '../modules/settings/settings.service.js';
import { logger } from './logger.js';

const registry = new RuleRegistry();
registry.register(new ValidationRuleEvaluator());
registry.register(new PolicyRuleEvaluator());
registry.register(new DecisionTableEvaluator());

// Per-tenant rule cache (30s TTL) — invalidated on activate/deactivate
const ruleCache = new Map<string, { data: RuleDefinitionSchema[]; ts: number }>();
const settingsCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL_MS = 30_000;

export function invalidateEnforcerCache(tenantId?: Buffer): void {
  if (tenantId) {
    const key = tenantId.toString('hex');
    ruleCache.delete(key);
    settingsCache.delete(key);
  } else {
    ruleCache.clear();
    settingsCache.clear();
  }
}

async function resolveSettings(tenantId: Buffer): Promise<Record<string, unknown>> {
  const key = tenantId.toString('hex');
  const cached = settingsCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  const data = await settingsService.resolve(tenantId, {});
  settingsCache.set(key, { data, ts: Date.now() });
  return data;
}

async function loadRules(tenantId: Buffer): Promise<RuleDefinitionSchema[]> {
  const key = tenantId.toString('hex');
  const cached = ruleCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const rows = await db
    .select()
    .from(ruleDefinitions)
    .where(and(eq(ruleDefinitions.tenantId, tenantId), eq(ruleDefinitions.isActive, true)));

  const parsed: RuleDefinitionSchema[] = [];
  for (const row of rows) {
    const result = RuleDefinitionSchema.safeParse({
      id: binaryToUuid(row.id as unknown as Buffer),
      tenantId: binaryToUuid(tenantId),
      name: row.name,
      description: row.description ?? undefined,
      engine: row.engine,
      triggerEvent: row.triggerEvent ?? undefined,
      priority: row.priority,
      body: row.body,
      version: row.version,
      isActive: row.isActive,
    });
    if (result.success) parsed.push(result.data);
    else logger.warn({ ruleId: binaryToUuid(row.id as unknown as Buffer), err: result.error }, '[enforcer] skipping malformed rule');
  }

  const sorted = parsed.sort((a, b) => a.priority - b.priority);
  ruleCache.set(key, { data: sorted, ts: Date.now() });
  return sorted;
}

// Build a flat facts dict: caller-supplied facts + setting.KEY for every setting
async function buildFacts(
  tenantId: Buffer,
  extra: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const settings = await resolveSettings(tenantId);
  const facts: Record<string, unknown> = { ...extra };
  for (const [k, v] of Object.entries(settings)) {
    facts[`setting.${k}`] = v;
  }
  return facts;
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationViolation {
  ruleId: string;
  ruleName: string;
  errorCode?: string;
  errorMessage?: string;
  allowOverride: boolean;
  overrideRole?: string;
}

/**
 * Run all active validation rules for the given entity + when pair.
 * The caller is responsible for including all necessary computed facts
 * (e.g. resulting_quantity, existing_customer_by_phone) in `facts`.
 */
export async function checkValidation(
  tenantId: Buffer,
  entity: string,
  when: string,
  facts: Record<string, unknown>,
): Promise<ValidationViolation[]> {
  const allRules = await loadRules(tenantId);
  const applicable = allRules.filter((r) => {
    if (r.engine !== 'validation') return false;
    const body = r.body as { entity?: string; when?: string };
    return body.entity === entity && body.when === when;
  });
  if (applicable.length === 0) return [];

  const enrichedFacts = await buildFacts(tenantId, facts);
  const violations: ValidationViolation[] = [];

  for (const rule of applicable) {
    try {
      const { output } = await registry.evaluate(rule, enrichedFacts);
      const result = output as ValidationOutput;
      if (!result.passed) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ...(result.errorCode !== undefined && { errorCode: result.errorCode }),
          ...(result.errorMessage !== undefined && { errorMessage: result.errorMessage }),
          allowOverride: result.allowOverride,
          ...(result.overrideRole !== undefined && { overrideRole: result.overrideRole }),
        });
        void db.insert(domainEvents).values({
          tenantId,
          streamType: 'rule_execution',
          streamId: uuidToBinary(uuidv7()),
          version: 1,
          eventType: 'rule.evaluated',
          payload: {
            ruleId: rule.id,
            ruleName: rule.name,
            engine: 'validation',
            entity,
            when,
            result: 'failed',
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
          },
          metadata: {},
        }).catch(() => undefined);
      }
    } catch (err) {
      logger.error({ ruleId: rule.id, entity, when, err }, '[enforcer] validation rule error');
    }
  }
  return violations;
}

// ── Policy ────────────────────────────────────────────────────────────────────

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  decidedBy?: string;
}

/**
 * Run all active policy rules for the given action.
 * facts should include: subject (roles[], userId, home_location_id, ...),
 * resource (the entity being acted on), and any computed values.
 * Returns denied as soon as any rule denies. Defaults to allowed.
 */
export async function checkPolicy(
  tenantId: Buffer,
  action: string,
  facts: Record<string, unknown>,
): Promise<PolicyDecision> {
  const allRules = await loadRules(tenantId);
  const applicable = allRules.filter((r) => {
    if (r.engine !== 'policy') return false;
    const body = r.body as { action?: string };
    return !body.action || body.action === action;
  });
  if (applicable.length === 0) return { allowed: true };

  const enrichedFacts = await buildFacts(tenantId, facts);

  for (const rule of applicable) {
    try {
      const { output } = await registry.evaluate(rule, enrichedFacts);
      const result = output as PolicyOutput;
      if (!result.allowed) {
        void db.insert(domainEvents).values({
          tenantId,
          streamType: 'rule_execution',
          streamId: uuidToBinary(uuidv7()),
          version: 1,
          eventType: 'rule.evaluated',
          payload: {
            ruleId: rule.id,
            ruleName: rule.name,
            engine: 'policy',
            action,
            result: 'denied',
            reason: result.reason,
          },
          metadata: {},
        }).catch(() => undefined);
        return {
          allowed: false,
          ...(result.reason !== undefined && { reason: result.reason }),
          decidedBy: rule.name,
        };
      }
    } catch (err) {
      logger.error({ ruleId: rule.id, action, err }, '[enforcer] policy rule error');
    }
  }
  return { allowed: true };
}

// ── Decision ──────────────────────────────────────────────────────────────────

/**
 * Evaluate the first active decision rule whose body matches `matchFn`.
 * Returns null if no matching rule is found or none is active.
 */
export async function evaluateDecision(
  tenantId: Buffer,
  matchFn: (body: unknown) => boolean,
  facts: Record<string, unknown>,
): Promise<DecisionOutput | null> {
  const allRules = await loadRules(tenantId);
  const rule = allRules.find((r) => r.engine === 'decision' && matchFn(r.body));
  if (!rule) return null;

  const enrichedFacts = await buildFacts(tenantId, facts);
  try {
    const { output } = await registry.evaluate(rule, enrichedFacts);
    return output as DecisionOutput;
  } catch (err) {
    logger.error({ ruleId: rule.id, err }, '[enforcer] decision rule error');
    return null;
  }
}
