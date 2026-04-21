import { z } from 'zod';

export const DataType = z.enum([
  'string', 'text', 'number', 'decimal', 'boolean',
  'date', 'datetime', 'enum', 'reference', 'json',
]);
export type DataType = z.infer<typeof DataType>;

export const FieldConfig = z.object({
  minLength: z.number().int().optional(),
  maxLength: z.number().int().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  referenceEntity: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  pattern: z.string().optional(),
});
export type FieldConfig = z.infer<typeof FieldConfig>;

export const CreateFieldDefinitionRequest = z.object({
  entityType: z.string().max(50),
  fieldKey: z
    .string()
    .max(100)
    .regex(/^[a-z_][a-z0-9_]*$/, 'Field key must be snake_case'),
  label: z.string().min(1).max(255),
  dataType: DataType,
  config: FieldConfig.optional(),
  isRequired: z.boolean().default(false),
  isIndexed: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  section: z.string().max(100).optional(),
});
export type CreateFieldDefinitionRequest = z.infer<typeof CreateFieldDefinitionRequest>;

export const FieldDefinitionResponse = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  entityType: z.string(),
  fieldKey: z.string(),
  label: z.string(),
  dataType: DataType,
  config: FieldConfig,
  isRequired: z.boolean(),
  isIndexed: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number(),
  section: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type FieldDefinitionResponse = z.infer<typeof FieldDefinitionResponse>;

export const RuleEngine = z.enum(['validation', 'decision', 'reactive', 'policy']);
export type RuleEngine = z.infer<typeof RuleEngine>;

export const CreateRuleRequest = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  engine: RuleEngine,
  triggerEvent: z.string().max(100).optional(),
  priority: z.number().int().default(100),
  body: z.unknown(),
  authoredFromNaturalLanguage: z.string().optional(),
});
export type CreateRuleRequest = z.infer<typeof CreateRuleRequest>;

export const RuleResponse = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  engine: RuleEngine,
  triggerEvent: z.string().nullable(),
  priority: z.number(),
  body: z.unknown(),
  version: z.number(),
  isActive: z.boolean(),
  authoredFromNaturalLanguage: z.string().nullable(),
  createdAt: z.string().datetime(),
  activatedAt: z.string().datetime().nullable(),
});
export type RuleResponse = z.infer<typeof RuleResponse>;

export const ActivateRuleRequest = z.object({
  ruleId: z.string().uuid(),
});
export type ActivateRuleRequest = z.infer<typeof ActivateRuleRequest>;
