import { z } from 'zod';

export const CreateProductRequest = z.object({
  sku: z.string().min(1).max(64).trim(),
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(5000).optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  unitOfMeasure: z.string().max(20).default('unit'),
  basePrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative(),
  taxClass: z.string().max(50).optional(),
  trackLots: z.boolean().default(false),
  trackSerials: z.boolean().default(false),
  reorderPoint: z.number().nonnegative().optional(),
  reorderQty: z.number().positive().optional(),
  customFields: z.record(z.unknown()).optional(),
});
export type CreateProductRequest = z.infer<typeof CreateProductRequest>;

export const UpdateProductRequest = CreateProductRequest.partial().omit({ sku: true });
export type UpdateProductRequest = z.infer<typeof UpdateProductRequest>;

export const ProductResponse = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  subcategory: z.string().nullable(),
  unitOfMeasure: z.string(),
  basePrice: z.number(),
  costPrice: z.number(),
  taxClass: z.string().nullable(),
  trackLots: z.boolean(),
  trackSerials: z.boolean(),
  reorderPoint: z.number().nullable(),
  reorderQty: z.number().nullable(),
  isActive: z.boolean(),
  customFields: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProductResponse = z.infer<typeof ProductResponse>;

export const ProductListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuery>;

export const PaginatedProducts = z.object({
  items: z.array(ProductResponse),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type PaginatedProducts = z.infer<typeof PaginatedProducts>;
