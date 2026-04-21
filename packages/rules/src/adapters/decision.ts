import type { RuleEvaluator, RuleDefinitionSchema, CompiledRule } from '../index.js';

type Operator = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'between' | 'contains' | 'any';

interface Condition {
  op: Operator;
  value: unknown;
}

interface DecisionRow {
  conditions: Array<Condition | null>;
  outputs: unknown[];
  priority?: number;
}

export interface DecisionTable {
  hitPolicy: 'first' | 'unique' | 'collect' | 'rule_order';
  inputs: string[];
  outputs: string[];
  rows: DecisionRow[];
}

function matchesCondition(inputVal: unknown, cond: Condition | null): boolean {
  if (cond == null) return true;
  switch (cond.op) {
    case '==': return inputVal === cond.value;
    case '!=': return inputVal !== cond.value;
    case '>':  return typeof inputVal === 'number' && typeof cond.value === 'number' && inputVal > cond.value;
    case '>=': return typeof inputVal === 'number' && typeof cond.value === 'number' && inputVal >= cond.value;
    case '<':  return typeof inputVal === 'number' && typeof cond.value === 'number' && inputVal < cond.value;
    case '<=': return typeof inputVal === 'number' && typeof cond.value === 'number' && inputVal <= cond.value;
    case 'in': return Array.isArray(cond.value) && cond.value.includes(inputVal);
    case 'any': return true;
    case 'between': {
      const [lo, hi] = cond.value as [number, number];
      return typeof inputVal === 'number' && inputVal >= lo && inputVal <= hi;
    }
    case 'contains': {
      if (typeof inputVal === 'string' && typeof cond.value === 'string') {
        return inputVal.includes(cond.value);
      }
      if (Array.isArray(inputVal)) return inputVal.includes(cond.value);
      return false;
    }
    default:
      return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export type DecisionOutput = Record<string, unknown> | Record<string, unknown>[];

export class DecisionTableEvaluator implements RuleEvaluator<Record<string, unknown>, DecisionOutput> {
  canHandle(rule: RuleDefinitionSchema): boolean {
    return rule.engine === 'decision';
  }

  compile(rule: RuleDefinitionSchema): CompiledRule<Record<string, unknown>, DecisionOutput> {
    const table = rule.body as DecisionTable;

    return {
      id: rule.id,
      engine: rule.engine,
      async evaluate(input: Record<string, unknown>): Promise<DecisionOutput> {
        const hits: Record<string, unknown>[] = [];

        for (const row of table.rows) {
          const rowMatches = row.conditions.every((cond, idx) => {
            const path = table.inputs[idx];
            if (!path) return true;
            const inputVal = getNestedValue(input, path);
            return matchesCondition(inputVal, cond);
          });

          if (rowMatches) {
            const out: Record<string, unknown> = {};
            row.outputs.forEach((v, i) => {
              const key = table.outputs[i];
              if (key) out[key] = v;
            });
            hits.push(out);

            if (table.hitPolicy === 'first') break;
            if (table.hitPolicy === 'unique' && hits.length > 1) {
              throw new Error('Decision table unique hit policy violated: multiple rows matched');
            }
          }
        }

        if (table.hitPolicy === 'collect') return hits;
        if (hits.length === 0) return {};
        return hits[0]!;
      },
    };
  }
}
