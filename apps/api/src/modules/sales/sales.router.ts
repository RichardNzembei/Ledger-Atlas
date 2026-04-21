import { Router } from 'express';
import {
  CreateSaleRequest,
  CompleteSaleRequest,
  VoidSaleRequest,
  ReturnItemsRequest,
  SaleListQuery,
} from '@inventory/contracts/sales';
import { NotFoundError, UnauthorizedError } from '@inventory/domain/errors';
import { uuidToBinary } from '@inventory/domain/utils';
import { requireRole } from '../../middleware/requireRole.js';
import { salesService } from './sales.service.js';
import { checkPolicy } from '../../infra/ruleEnforcer.js';

export const salesRouter = Router();

salesRouter.get('/', async (req, res, next) => {
  try {
    const query = SaleListQuery.parse(req.query);
    const items = await salesService.listSales(req.context.tenantId, query);
    res.json({ items, total: items.length, limit: query.limit, offset: query.offset });
  } catch (err) {
    next(err);
  }
});

salesRouter.post('/', requireRole('admin', 'manager', 'cashier'), async (req, res, next) => {
  try {
    const body = CreateSaleRequest.parse(req.body);
    const sale = await salesService.createSale(req.context.tenantId, body, req.context.userId);
    res.status(201).json(sale);
  } catch (err) {
    next(err);
  }
});

salesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = uuidToBinary(req.params['id']!);
    const sale = await salesService.getSale(req.context.tenantId, id);
    res.json(sale);
  } catch (err) {
    next(err);
  }
});

salesRouter.post('/complete', requireRole('admin', 'manager', 'cashier'), async (req, res, next) => {
  try {
    const body = CompleteSaleRequest.parse(req.body);

    // Policy check: cash-only limit, credit checks, and any sale.complete policies
    const paymentMethods = body.payments.map((p) => p.method);
    const saleTotal = body.payments.reduce((sum, p) => sum + p.amount, 0);
    const decision = await checkPolicy(req.context.tenantId, 'sale.complete', {
      'subject.roles': req.context.roles,
      'subject.userId': req.context.userIdHex,
      'resource.payment_methods': paymentMethods,
      'resource.total': saleTotal,
      'resource.sale_id': body.saleId,
    });
    if (!decision.allowed) {
      throw new UnauthorizedError(decision.reason ?? 'sale.complete denied by policy');
    }

    const sale = await salesService.completeSale(req.context.tenantId, body, req.context.userId);
    res.json(sale);
  } catch (err) {
    next(err);
  }
});

salesRouter.post('/void', requireRole('admin', 'manager', 'cashier'), async (req, res, next) => {
  try {
    const body = VoidSaleRequest.parse(req.body);

    // Policy check: sale void authorization (recipe 11)
    const sale = await salesService.getSale(req.context.tenantId, uuidToBinary(body.saleId));
    const ageHours =
      (Date.now() - new Date(sale.createdAt).getTime()) / 3_600_000;
    const decision = await checkPolicy(req.context.tenantId, 'sale.void', {
      'subject.roles': req.context.roles,
      'subject.userId': req.context.userIdHex,
      'subject.home_location_id': req.context.roles.includes('admin') ? null : sale.locationId,
      'resource.location_id': sale.locationId,
      'resource.age_hours': ageHours,
      'resource.sale_id': body.saleId,
    });
    if (!decision.allowed) {
      throw new UnauthorizedError(decision.reason ?? 'sale.void denied by policy');
    }

    const result = await salesService.voidSale(req.context.tenantId, body, req.context.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

salesRouter.post('/return', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const body = ReturnItemsRequest.parse(req.body);
    const result = await salesService.returnItems(req.context.tenantId, body, req.context.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
