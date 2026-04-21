import { z } from 'zod';
import type { FieldDefinitionResponse } from '@inventory/contracts';

export function useDynamicSchema(fields: Ref<FieldDefinitionResponse[]>) {
  return computed(() => buildSchemaFromFields(fields.value));
}

export function buildSchemaFromFields(fields: FieldDefinitionResponse[]): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  for (const f of fields) {
    let s: z.ZodTypeAny;
    const cfg = f.config as Record<string, unknown>;

    switch (f.dataType) {
      case 'string':
        s = z.string()
          .max((cfg['maxLength'] as number | undefined) ?? 255)
          .min((cfg['minLength'] as number | undefined) ?? 0);
        break;
      case 'text':
        s = z.string().max(10_000);
        break;
      case 'number':
        s = z.number()
          .min((cfg['min'] as number | undefined) ?? -Infinity)
          .max((cfg['max'] as number | undefined) ?? Infinity);
        break;
      case 'decimal':
        s = z.number()
          .min((cfg['min'] as number | undefined) ?? -Infinity)
          .max((cfg['max'] as number | undefined) ?? Infinity);
        break;
      case 'boolean':
        s = z.boolean();
        break;
      case 'date':
        s = z.string().date();
        break;
      case 'datetime':
        s = z.string().datetime();
        break;
      case 'enum': {
        const options = (cfg['options'] as Array<{ value: string }> | undefined) ?? [];
        const values = options.map((o) => o.value);
        s = z.enum(values as [string, ...string[]]);
        break;
      }
      case 'reference':
        s = z.string().uuid();
        break;
      default:
        s = z.unknown();
    }

    shape[f.fieldKey] = f.isRequired ? s : s.optional();
  }

  return z.object(shape);
}
