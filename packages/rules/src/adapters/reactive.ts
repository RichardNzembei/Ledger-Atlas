import { Engine } from 'json-rules-engine';
import type { RuleEvaluator, RuleDefinitionSchema, CompiledRule } from '../index.js';

export interface ReactiveOutput {
  fired: boolean;
  actions: Array<{ type: string; params?: Record<string, unknown> }>;
}

export class ReactiveRuleEvaluator implements RuleEvaluator<Record<string, unknown>, ReactiveOutput> {
  canHandle(rule: RuleDefinitionSchema): boolean {
    return rule.engine === 'reactive';
  }

  compile(rule: RuleDefinitionSchema): CompiledRule<Record<string, unknown>, ReactiveOutput> {
    const engine = new Engine([], { allowUndefinedFacts: true });
    engine.addRule(rule.body as Parameters<typeof engine.addRule>[0]);

    return {
      id: rule.id,
      engine: rule.engine,
      async evaluate(input: Record<string, unknown>): Promise<ReactiveOutput> {
        const { events, failureEvents } = await engine.run(input);
        void failureEvents;
        return {
          fired: events.length > 0,
          actions: events.map((e) => ({
            type: e.type,
            ...(e.params !== undefined && { params: e.params as Record<string, unknown> }),
          })),
        };
      },
    };
  }
}
