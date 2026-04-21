import { z } from 'zod';

export const CreateCustomerRequest = z.object({
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(30).optional(),
  code: z.string().max(50).optional(),
  segment: z.enum(['retail', 'wholesale', 'vip', 'staff']).default('retail'),
  creditLimit: z.number().nonnegative().default(0),
  address: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  customFields: z.record(z.unknown()).optional(),
});
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequest>;

export const UpdateCustomerRequest = CreateCustomerRequest.partial();
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequest>;

export const CustomerResponse = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  segment: z.string(),
  creditLimit: z.number(),
  balance: z.number(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  customFields: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CustomerResponse = z.infer<typeof CustomerResponse>;

export const CustomerListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
  segment: z.enum(['retail', 'wholesale', 'vip', 'staff']).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type CustomerListQuery = z.infer<typeof CustomerListQuery>;
