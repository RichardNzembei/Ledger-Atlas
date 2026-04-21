import { logger } from './logger.js';
import { eventBus } from './eventBus.js';
import type { RuleDefinitionSchema } from '@inventory/rules';

// Replace {{path.to.value}} with values from the facts dict
function interpolate(template: string, facts: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, rawPath: string) => {
    const path = rawPath.trim();
    // Try exact key first (covers dotted keys like 'setting.pos.currency')
    if (path in facts) return String(facts[path]);
    // Fall back to nested traversal
    const val = path.split('.').reduce((acc: unknown, key) => {
      if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, facts as unknown);
    return val !== undefined && val !== null ? String(val) : `{{${path}}}`;
  });
}

function interpolateDeep(value: unknown, facts: Record<string, unknown>): unknown {
  if (typeof value === 'string') return interpolate(value, facts);
  if (Array.isArray(value)) return value.map((v) => interpolateDeep(v, facts));
  if (value != null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, interpolateDeep(v, facts)]),
    );
  }
  return value;
}

export interface ActionContext {
  tenantId: Buffer;
  facts: Record<string, unknown>;
  rule: RuleDefinitionSchema;
}

type ActionPayload = Record<string, unknown>;

function resolve(action: ActionPayload, facts: Record<string, unknown>): ActionPayload {
  return interpolateDeep(action, facts) as ActionPayload;
}

function publish(type: string, tenantId: Buffer, payload: Record<string, unknown>): void {
  eventBus.publish({ type, tenantId, payload, metadata: {}, occurredAt: new Date() });
}

async function handleNotify(action: ActionPayload, ctx: ActionContext): Promise<void> {
  const r = resolve(action, ctx.facts);
  publish('notification.queued', ctx.tenantId, {
    channel: r['channel'] ?? 'email',
    template: r['template'],
    to: r['to'],
    recipients: r['recipients'],
    recipients_role: r['recipients_role'],
    subject: r['subject'],
    message: r['message'],
    data: r['data'],
    ruleId: ctx.rule.id,
    ruleName: ctx.rule.name,
  });
  logger.info(
    { ruleId: ctx.rule.id, channel: r['channel'], template: r['template'] },
    '[rules] notification queued',
  );
}

async function handleCreateRecord(action: ActionPayload, ctx: ActionContext): Promise<void> {
  const r = resolve(action, ctx.facts);
  publish('record.create_requested', ctx.tenantId, {
    entity: r['entity'],
    data: r['data'],
    store_result_as: r['store_result_as'],
    ruleId: ctx.rule.id,
  });
  logger.info({ ruleId: ctx.rule.id, entity: r['entity'] }, '[rules] record create queued');
}

async function handleUpdateRecord(action: ActionPayload, ctx: ActionContext): Promise<void> {
  const r = resolve(action, ctx.facts);
  publish('record.update_requested', ctx.tenantId, {
    entity: r['entity'],
    id: r['id'],
    updates: r['updates'],
    condition: r['condition'],
    ruleId: ctx.rule.id,
  });
  logger.info(
    { ruleId: ctx.rule.id, entity: r['entity'], id: r['id'] },
    '[rules] record update queued',
  );
}

async function handleGenerateReport(action: ActionPayload, ctx: ActionContext): Promise<void> {
  const r = resolve(action, ctx.facts);
  publish('report.requested', ctx.tenantId, {
    template: r['template'],
    parameters: r['parameters'],
    sections: r['sections'],
    recipients: r['recipients'],
    format: r['format'],
    ruleId: ctx.rule.id,
  });
  logger.info({ ruleId: ctx.rule.id, template: r['template'] }, '[rules] report requested');
}

export async function dispatchActions(
  actions: Array<ActionPayload>,
  ctx: ActionContext,
): Promise<void> {
  for (const action of actions) {
    const type = action['type'] as string | undefined;
    try {
      switch (type) {
        case 'notify':
          await handleNotify(action, ctx);
          break;
        case 'create_record':
          await handleCreateRecord(action, ctx);
          break;
        case 'update_record':
          await handleUpdateRecord(action, ctx);
          break;
        case 'generate_report':
          await handleGenerateReport(action, ctx);
          break;
        default:
          logger.warn({ ruleId: ctx.rule.id, actionType: type }, '[rules] unknown action type — skipped');
      }
    } catch (err) {
      logger.error({ ruleId: ctx.rule.id, actionType: type, err }, '[rules] action dispatch failed');
    }
  }
}
