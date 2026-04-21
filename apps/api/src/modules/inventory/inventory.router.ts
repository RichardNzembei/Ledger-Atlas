import { Router } from 'express';
import {
  ReceiveStockRequest,
  TransferStockRequest,
  AdjustStockRequest,
  StockLevelQuery,
} from '@inventory/contracts/inventory';
import { inventoryService } from './inventory.service.js';
import { requireRole } from '../../middleware/requireRole.js';

export const inventoryRouter = Router();

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
    const result = await inventoryService.replayStream(req.context.tenantId, req.params['productId']!);
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
      await inventoryService.adjustStock(req.context.tenantId, body, req.context.userId);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);
