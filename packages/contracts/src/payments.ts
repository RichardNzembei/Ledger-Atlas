import { z } from 'zod';

export const InitiateMpesaPaymentRequest = z.object({
  saleId: z.string().uuid(),
  phone: z
    .string()
    .regex(/^254[0-9]{9}$/, 'Phone must be in format 254XXXXXXXXX'),
  amount: z.number().positive(),
});
export type InitiateMpesaPaymentRequest = z.infer<typeof InitiateMpesaPaymentRequest>;

export const MpesaCallbackPayload = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            }),
          ),
        })
        .optional(),
    }),
  }),
});
export type MpesaCallbackPayload = z.infer<typeof MpesaCallbackPayload>;

export const PaymentStatusResponse = z.object({
  id: z.string().uuid(),
  saleId: z.string().uuid(),
  method: z.string(),
  amount: z.number(),
  status: z.enum(['pending', 'confirmed', 'failed', 'refunded']),
  reference: z.string().nullable(),
  confirmedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type PaymentStatusResponse = z.infer<typeof PaymentStatusResponse>;
