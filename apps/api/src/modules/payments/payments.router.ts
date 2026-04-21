import { Router } from 'express';
import { InitiateMpesaPaymentRequest, MpesaCallbackPayload } from '@inventory/contracts/payments';
import { and, eq } from 'drizzle-orm';
import { payments, sales } from '@inventory/db/schema';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import { DomainError, NotFoundError } from '@inventory/domain/errors';
import { mpesa } from './mpesa.service.js';
import { db } from '../../infra/db.js';
import { eventBus } from '../../infra/eventBus.js';
import { EventTypes } from '@inventory/events';
import { config } from '../../config/index.js';
import { logger } from '../../infra/logger.js';

export const paymentsRouter: Router = Router();

paymentsRouter.post('/mpesa/stk-push', async (req, res, next) => {
  try {
    const body = InitiateMpesaPaymentRequest.parse(req.body);
    const saleIdBuf = uuidToBinary(body.saleId);

    const saleRows = await db
      .select({ id: sales.id, total: sales.total })
      .from(sales)
      .where(and(eq(sales.id, saleIdBuf), eq(sales.tenantId, req.context.tenantId)))
      .limit(1);

    if (!saleRows[0]) throw new NotFoundError('Sale', body.saleId);

    const paymentId = uuidToBinary(uuidv7());

    await db.insert(payments).values({
      id: paymentId,
      saleId: saleIdBuf,
      tenantId: req.context.tenantId,
      method: 'mpesa',
      amount: String(body.amount),
      reference: null,
      status: 'pending',
    });

    const callbackUrl = config.MPESA_CALLBACK_URL || `${process.env['API_URL']}/api/v1/payments/mpesa/callback`;

    const result = await mpesa.stkPush({
      amount: body.amount,
      phone: body.phone,
      accountReference: body.saleId.slice(0, 12),
      transactionDesc: 'Payment',
      callbackUrl,
    });

    res.json({
      paymentId: binaryToUuid(paymentId),
      checkoutRequestId: result['CheckoutRequestID'],
    });
  } catch (err) {
    next(err);
  }
});

// No auth required — called by Safaricom servers
paymentsRouter.post('/mpesa/callback', async (req, res) => {
  try {
    const payload = MpesaCallbackPayload.parse(req.body);
    const { stkCallback } = payload.Body;

    logger.info({ stkCallback }, 'M-Pesa callback received');

    const reference = stkCallback.CheckoutRequestID;
    const success = stkCallback.ResultCode === 0;

    const mpesaRef = stkCallback.CallbackMetadata?.Item.find(
      (i) => i.Name === 'MpesaReceiptNumber',
    )?.Value;

    const paymentRows = await db
      .select()
      .from(payments)
      .where(and(eq(payments.reference, reference), eq(payments.method, 'mpesa')))
      .limit(1);

    if (paymentRows[0]) {
      const payment = paymentRows[0];
      await db
        .update(payments)
        .set({
          status: success ? 'confirmed' : 'failed',
          reference: mpesaRef ? String(mpesaRef) : reference,
          providerResponse: stkCallback as unknown as Record<string, unknown>,
          confirmedAt: success ? new Date() : null,
        })
        .where(eq(payments.id, payment.id));

      eventBus.publish({
        type: success ? EventTypes.PAYMENT_CONFIRMED : EventTypes.PAYMENT_FAILED,
        tenantId: payment.tenantId as Buffer,
        payload: {
          paymentId: binaryToUuid(payment.id as Buffer),
          saleId: binaryToUuid(payment.saleId as Buffer),
          amount: Number(payment.amount),
          reference: String(mpesaRef ?? ''),
        },
        metadata: {},
        occurredAt: new Date(),
      });
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    logger.error({ err }, 'M-Pesa callback error');
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});
