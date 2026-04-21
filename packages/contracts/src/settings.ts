import { z } from 'zod';

export const SettingScope = z.enum(['tenant', 'location', 'user']);
export type SettingScope = z.infer<typeof SettingScope>;

export const UpsertSettingRequest = z.object({
  key: z.string().min(1).max(200),
  value: z.unknown(),
  scopeType: SettingScope.default('tenant'),
  scopeId: z.string().uuid().optional(),
});
export type UpsertSettingRequest = z.infer<typeof UpsertSettingRequest>;

export const SettingResponse = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  key: z.string(),
  value: z.unknown(),
  scopeType: SettingScope,
  scopeId: z.string().uuid().nullable(),
  updatedAt: z.string().datetime(),
});
export type SettingResponse = z.infer<typeof SettingResponse>;

export const SettingQuery = z.object({
  scopeType: SettingScope.optional(),
  scopeId: z.string().uuid().optional(),
  prefix: z.string().optional(),
});
export type SettingQuery = z.infer<typeof SettingQuery>;

export const ResolvedSettings = z.record(z.unknown());
export type ResolvedSettings = z.infer<typeof ResolvedSettings>;
