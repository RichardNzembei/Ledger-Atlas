import { z } from 'zod';

export const LoginRequest = z.object({
  tenantSlug: z.string().min(1).max(63),
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const LoginResponse = z.object({
  token: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    tenantId: z.string().uuid(),
    tenantSlug: z.string(),
    roles: z.array(z.string()),
  }),
});
export type LoginResponse = z.infer<typeof LoginResponse>;

export const RefreshRequest = z.object({
  refreshToken: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequest>;

export const RegisterTenantRequest = z.object({
  tenantName: z.string().min(2).max(255),
  tenantSlug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  adminEmail: z.string().email().max(320),
  adminPassword: z.string().min(8).max(128),
  adminName: z.string().min(2).max(255),
});
export type RegisterTenantRequest = z.infer<typeof RegisterTenantRequest>;

export const ChangePasswordRequest = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequest>;
