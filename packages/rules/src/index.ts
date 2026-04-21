import { z } from 'zod';

export const RuleEngine = z.enum(['validation', 'decision', 'reactive', 'policy']);
export type RuleEngine = z.infer<typeof RuleEngine>;

export const RuleDefinitionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  engine: RuleEngine,
  triggerEvent: z.string().optional(),
  priority: z.number().int().default(100),
  body: z.unknown(),
  version: z.number().int(),
  isActive: z.boolean(),
});
export type RuleDefinitionSchema = z.infer<typeof RuleDefinitionSchema>;

export interface RuleEvaluator<TInput = unknown, TOutput = unknown> {
  canHandle(rule: RuleDefinitionSchema): boolean;
  compile(rule: RuleDefinitionSchema): CompiledRule<TInput, TOutput>;
}

export interface CompiledRule<TInput = unknown, TOutput = unknown> {
  id: string;
  engine: RuleEngine;
  evaluate(input: TInput): Promise<TOutput>;
}

export interface RuleTrace {
  ruleId: string;
  ruleName: string;
  engine: RuleEngine;
  input: unknown;
  output: unknown;
  durationMs: number;
  firedAt: string;
}

export class RuleRegistry {
  private evaluators: RuleEvaluator[] = [];

  register(evaluator: RuleEvaluator): this {
    this.evaluators.push(evaluator);
    return this;
  }

  compile(rule: RuleDefinitionSchema): CompiledRule {
    const evaluator = this.evaluators.find((e) => e.canHandle(rule));
    if (!evaluator) {
      throw new Error(`No evaluator registered for rule engine: ${rule.engine}`);
    }
    return evaluator.compile(rule);
  }

  async evaluate(
    rule: RuleDefinitionSchema,
    input: unknown,
  ): Promise<{ output: unknown; trace: RuleTrace }> {
    const compiled = this.compile(rule);
    const start = Date.now();
    const output = await compiled.evaluate(input);
    return {
      output,
      trace: {
        ruleId: rule.id,
        ruleName: rule.name,
        engine: rule.engine,
        input,
        output,
        durationMs: Date.now() - start,
        firedAt: new Date().toISOString(),
      },
    };
  }
}

export { ReactiveRuleEvaluator } from './adapters/reactive.js';
export { DecisionTableEvaluator } from './adapters/decision.js';
