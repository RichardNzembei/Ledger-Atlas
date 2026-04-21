import { Engine } from 'json-rules-engine';
import type { RuleEvaluator, RuleDefinitionSchema, CompiledRule } from '../index.js';

export interface ReactiveOutput {
  fired: boolean;
  actions: Array<Record<string, unknown>>;
}

type ReactiveBody = {
  conditions?: unknown;
  actions?: Array<Record<string, unknown>>;
  event?: unknown; // native json-rules-engine format
};

export class ReactiveRuleEvaluator implements RuleEvaluator<Record<string, unknown>, ReactiveOutput> {
  canHandle(rule: RuleDefinitionSchema): boolean {
    return rule.engine === 'reactive';
  }

  compile(rule: RuleDefinitionSchema): CompiledRule<Record<string, unknown>, ReactiveOutput> {
    const body = rule.body as ReactiveBody;
    const engine = new Engine([], { allowUndefinedFacts: true });

    if (body.event) {
      // Native json-rules-engine format — event type maps to action type
      engine.addRule(rule.body as Parameters<typeof engine.addRule>[0]);
      return {
        id: rule.id,
        engine: rule.engine,
        async evaluate(input: Record<string, unknown>): Promise<ReactiveOutput> {
          const { events } = await engine.run(input);
          return {
            fired: events.length > 0,
            actions: events.map((e) => ({
              type: e.type,
              ...(e.params !== undefined ? (e.params as Record<string, unknown>) : {}),
            })),
          };
        },
      };
    }

    // Cookbook format: { conditions: {...}, actions: [...] }
    const declaredActions = body.actions ?? [];
    engine.addRule({
      conditions: body.conditions,
      event: { type: 'rule_fired' },
    } as Parameters<typeof engine.addRule>[0]);

    return {
      id: rule.id,
      engine: rule.engine,
      async evaluate(input: Record<string, unknown>): Promise<ReactiveOutput> {
        const { events } = await engine.run(input);
        const fired = events.some((e) => e.type === 'rule_fired');
        return {
          fired,
          actions: fired ? declaredActions : [],
        };
      },
    };
  }
}
