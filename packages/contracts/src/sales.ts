import { z } from 'zod';

export const CartItemInput = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative().optional(),
  discountPct: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});
export type CartItemInput = z.infer<typeof CartItemInput>;

export const CreateSaleRequest = z.object({
  locationId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(CartItemInput).min(1),
  notes: z.string().max(2000).optional(),
});
export type CreateSaleRequest = z.infer<typeof CreateSaleRequest>;

export const CompleteSaleRequest = z.object({
  saleId: z.string().uuid(),
  payments: z.array(
    z.object({
      method: z.enum(['cash', 'mpesa', 'card', 'bank_transfer', 'credit', 'other']),
      amount: z.number().positive(),
      reference: z.string().max(100).optional(),
    }),
  ).min(1),
});
export type CompleteSaleRequest = z.infer<typeof CompleteSaleRequest>;

export const VoidSaleRequest = z.object({
  saleId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
export type VoidSaleRequest = z.infer<typeof VoidSaleRequest>;

export const ReturnItemsRequest = z.object({
  saleId: z.string().uuid(),
  items: z.array(
    z.object({
      saleItemId: z.string().uuid(),
      quantity: z.number().positive(),
      reason: z.string().max(255),
    }),
  ).min(1),
  refundMethod: z.enum(['cash', 'mpesa', 'card', 'credit', 'other']),
});
export type ReturnItemsRequest = z.infer<typeof ReturnItemsRequest>;

export const SaleItemResponse = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  productSku: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountPct: z.number(),
  discountAmt: z.number(),
  taxPct: z.number(),
  taxAmt: z.number(),
  lineTotal: z.number(),
  notes: z.string().nullable(),
});
export type SaleItemResponse = z.infer<typeof SaleItemResponse>;

export const SaleResponse = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  saleNumber: z.string(),
  locationId: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  cashierId: z.string().uuid(),
  status: z.enum(['open', 'completed', 'voided', 'refunded', 'partially_refunded']),
  subtotal: z.number(),
  discountTotal: z.number(),
  taxTotal: z.number(),
  total: z.number(),
  paid: z.number(),
  changeGiven: z.number(),
  currency: z.string(),
  items: z.array(SaleItemResponse),
  notes: z.string().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SaleResponse = z.infer<typeof SaleResponse>;

export const SaleListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  locationId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(['open', 'completed', 'voided', 'refunded', 'partially_refunded']).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
});
export type SaleListQuery = z.infer<typeof SaleListQuery>;
