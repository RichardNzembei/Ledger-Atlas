import { Engine } from 'json-rules-engine';
import type { RuleEvaluator, RuleDefinitionSchema, CompiledRule } from '../index.js';

export interface PolicyOutput {
  allowed: boolean;
  reason?: string;
}

interface PolicyBody {
  action?: string;
  conditions: Record<string, unknown>;
  effect: 'allow' | 'deny';
  default_effect?: 'allow' | 'deny';
  deny_reason?: string;
  reason?: string;
}

export class PolicyRuleEvaluator implements RuleEvaluator<Record<string, unknown>, PolicyOutput> {
  canHandle(rule: RuleDefinitionSchema): boolean {
    return rule.engine === 'policy';
  }

  compile(rule: RuleDefinitionSchema): CompiledRule<Record<string, unknown>, PolicyOutput> {
    const body = rule.body as PolicyBody;
    const defaultEffect = body.default_effect ?? 'deny';

    const engine = new Engine([], { allowUndefinedFacts: true });
    engine.addRule({
      conditions: body.conditions,
      event: { type: 'conditions_met' },
    } as Parameters<typeof engine.addRule>[0]);

    return {
      id: rule.id,
      engine: rule.engine,
      async evaluate(input: Record<string, unknown>): Promise<PolicyOutput> {
        const { events } = await engine.run(input);
        const conditionsMet = events.some((e) => e.type === 'conditions_met');
        const effectReason = body.deny_reason ?? body.reason;
        if (conditionsMet) {
          return {
            allowed: body.effect === 'allow',
            ...(body.effect === 'deny' && effectReason !== undefined && { reason: effectReason }),
          };
        }
        return {
          allowed: defaultEffect === 'allow',
          ...(defaultEffect === 'deny' && effectReason !== undefined && { reason: effectReason }),
        };
      },
    };
  }
}
