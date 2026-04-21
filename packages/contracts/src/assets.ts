import { z } from 'zod';

export const CreateAssetRequest = z.object({
  assetTag: z.string().min(1).max(64).trim(),
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(5000).optional(),
  category: z.string().max(100).optional(),
  locationId: z.string().uuid().optional(),
  acquiredAt: z.string().date().optional(),
  acquisitionCost: z.number().nonnegative().default(0),
  depreciationMethod: z
    .enum(['straight_line', 'declining_balance', 'units_of_production', 'none'])
    .default('straight_line'),
  usefulLifeMonths: z.number().int().positive().optional(),
  salvageValue: z.number().nonnegative().default(0),
  serialNumber: z.string().max(128).optional(),
  notes: z.string().max(2000).optional(),
  customFields: z.record(z.unknown()).optional(),
});
export type CreateAssetRequest = z.infer<typeof CreateAssetRequest>;

export const UpdateAssetRequest = CreateAssetRequest.partial().omit({ assetTag: true });
export type UpdateAssetRequest = z.infer<typeof UpdateAssetRequest>;

export const AssignAssetRequest = z.object({
  userId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});
export type AssignAssetRequest = z.infer<typeof AssignAssetRequest>;

export const AssetResponse = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  assetTag: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  status: z.enum(['active', 'in_maintenance', 'disposed', 'lost']),
  lifecycleStage: z.enum([
    'acquired', 'assigned', 'in_service', 'under_repair', 'decommissioned', 'disposed',
  ]),
  locationId: z.string().uuid().nullable(),
  assignedToUserId: z.string().uuid().nullable(),
  acquiredAt: z.string().date().nullable(),
  acquisitionCost: z.number(),
  bookValue: z.number(),
  depreciationMethod: z.string(),
  usefulLifeMonths: z.number().nullable(),
  salvageValue: z.number(),
  serialNumber: z.string().nullable(),
  notes: z.string().nullable(),
  customFields: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AssetResponse = z.infer<typeof AssetResponse>;

export const AssetListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(['active', 'in_maintenance', 'disposed', 'lost']).optional(),
  locationId: z.string().uuid().optional(),
});
export type AssetListQuery = z.infer<typeof AssetListQuery>;
