import { Engine } from 'json-rules-engine';
import type { RuleEvaluator, RuleDefinitionSchema, CompiledRule } from '../index.js';

export interface ValidationOutput {
  passed: boolean;
  errorCode?: string;
  errorMessage?: string;
  allowOverride: boolean;
  overrideRole?: string;
}

interface ValidationBody {
  entity?: string;
  when?: string;
  conditions: Record<string, unknown>;
  onFailure?: {
    message?: string;
    code?: string;
    allow_override?: boolean;
    override_role?: string;
  };
}

export class ValidationRuleEvaluator implements RuleEvaluator<Record<string, unknown>, ValidationOutput> {
  canHandle(rule: RuleDefinitionSchema): boolean {
    return rule.engine === 'validation';
  }

  compile(rule: RuleDefinitionSchema): CompiledRule<Record<string, unknown>, ValidationOutput> {
    const body = rule.body as ValidationBody;
    const onFailure = body.onFailure ?? {};

    const engine = new Engine([], { allowUndefinedFacts: true });
    engine.addRule({
      conditions: body.conditions,
      event: { type: 'validation_failed' },
    } as Parameters<typeof engine.addRule>[0]);

    return {
      id: rule.id,
      engine: rule.engine,
      async evaluate(input: Record<string, unknown>): Promise<ValidationOutput> {
        const { events } = await engine.run(input);
        if (events.some((e) => e.type === 'validation_failed')) {
          return {
            passed: false,
            ...(onFailure.code !== undefined && { errorCode: onFailure.code }),
            ...(onFailure.message !== undefined && { errorMessage: onFailure.message }),
            allowOverride: onFailure.allow_override ?? false,
            ...(onFailure.override_role !== undefined && { overrideRole: onFailure.override_role }),
          };
        }
        return { passed: true, allowOverride: false };
      },
    };
  }
}
