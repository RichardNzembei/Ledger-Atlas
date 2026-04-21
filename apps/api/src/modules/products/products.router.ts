import { Router } from 'express';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductListQuery,
} from '@inventory/contracts/products';
import { productsRepo } from './products.repository.js';
import { requireRole } from '../../middleware/requireRole.js';

export const productsRouter = Router();

productsRouter.get('/', async (req, res, next) => {
  try {
    const query = ProductListQuery.parse(req.query);
    const result = await productsRepo.list(req.context.tenantId, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/', requireRole('admin', 'manager', 'stock_manager'), async (req, res, next) => {
  try {
    const body = CreateProductRequest.parse(req.body);
    const product = await productsRepo.create(
      req.context.tenantId,
      body,
      req.context.userId,
    );
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await productsRepo.findById(req.context.tenantId, req.params['id']!);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.patch('/:id', requireRole('admin', 'manager', 'stock_manager'), async (req, res, next) => {
  try {
    const body = UpdateProductRequest.parse(req.body);
    const product = await productsRepo.update(req.context.tenantId, req.params['id']!, body);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.delete('/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    await productsRepo.deactivate(req.context.tenantId, req.params['id']!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
