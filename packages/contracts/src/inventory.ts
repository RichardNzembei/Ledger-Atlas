import { z } from 'zod';

export const ReceiveStockRequest = z.object({
  locationId: z.string().uuid(),
  poItemId: z.string().uuid().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
      lotNumber: z.string().max(64).optional(),
      serialNumbers: z.array(z.string().max(128)).optional(),
      unitCost: z.number().nonnegative().optional(),
    }),
  ).min(1),
  notes: z.string().max(1000).optional(),
});
export type ReceiveStockRequest = z.infer<typeof ReceiveStockRequest>;

export const TransferStockRequest = z.object({
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
    }),
  ).min(1),
  notes: z.string().max(1000).optional(),
});
export type TransferStockRequest = z.infer<typeof TransferStockRequest>;

export const AdjustStockRequest = z.object({
  locationId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      countedQty: z.number().nonnegative(),
      reason: z.string().max(255),
    }),
  ).min(1),
  notes: z.string().max(1000).optional(),
});
export type AdjustStockRequest = z.infer<typeof AdjustStockRequest>;

export const StockOnHandResponse = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.number(),
  reserved: z.number(),
  available: z.number(),
  updatedAt: z.string().datetime(),
});
export type StockOnHandResponse = z.infer<typeof StockOnHandResponse>;

export const StockLevelQuery = z.object({
  locationId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  belowReorderPoint: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});
export type StockLevelQuery = z.infer<typeof StockLevelQuery>;
