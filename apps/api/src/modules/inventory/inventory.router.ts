import { Router } from 'express';
import {
  ReceiveStockRequest,
  TransferStockRequest,
  AdjustStockRequest,
  StockLevelQuery,
} from '@inventory/contracts/inventory';
import { UnauthorizedError } from '@inventory/domain/errors';
import { inventoryService } from './inventory.service.js';
import { requireRole } from '../../middleware/requireRole.js';
import { checkPolicy } from '../../infra/ruleEnforcer.js';

export const inventoryRouter: Router = Router();

inventoryRouter.get('/stock', async (req, res, next) => {
  try {
    const query = StockLevelQuery.parse(req.query);
    const result = await inventoryService.getStockLevels(req.context.tenantId, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.post(
  '/receive',
  requireRole('admin', 'manager', 'stock_manager'),
  async (req, res, next) => {
    try {
      const body = ReceiveStockRequest.parse(req.body);
      await inventoryService.receiveStock(req.context.tenantId, body, req.context.userId);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

inventoryRouter.post(
  '/transfer',
  requireRole('admin', 'manager', 'stock_manager'),
  async (req, res, next) => {
    try {
      const body = TransferStockRequest.parse(req.body);
      await inventoryService.transferStock(req.context.tenantId, body, req.context.userId);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// Time-travel: replay event stream for a product to see full history
inventoryRouter.get('/stock/:productId/replay', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const result = await inventoryService.replayStream(req.context.tenantId, (req.params['productId'] as string));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.post(
  '/adjust',
  requireRole('admin', 'manager', 'stock_manager'),
  async (req, res, next) => {
    try {
      const body = AdjustStockRequest.parse(req.body);

      // Policy check: stocktake variance escalation (recipe 6) and any other stock.adjust policies
      for (const item of body.items) {
        const decision = await checkPolicy(req.context.tenantId, 'stock.adjust', {
          'subject.roles': req.context.roles,
          'subject.userId': req.context.userIdHex,
          'resource.location_id': body.locationId,
          'resource.product_id': item.productId,
          'resource.counted_qty': item.countedQty,
          'resource.reason': item.reason ?? '',
        });
        if (!decision.allowed) {
          throw new UnauthorizedError(decision.reason ?? 'stock.adjust denied by policy');
        }
      }

      await inventoryService.adjustStock(req.context.tenantId, body, req.context.userId);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);
