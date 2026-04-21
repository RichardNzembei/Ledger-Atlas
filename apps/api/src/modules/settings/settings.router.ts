import { Router } from 'express';
import { UpsertSettingRequest, SettingQuery } from '@inventory/contracts/settings';
import { settingsService } from './settings.service.js';
import { requireAdmin } from '../../middleware/requireRole.js';

export const settingsRouter = Router();

settingsRouter.get('/', async (req, res, next) => {
  try {
    const { scopeType } = req.query as { scopeType?: string };
    const rows = await settingsService.list(req.context.tenantId, scopeType as 'tenant' | 'location' | 'user' | undefined);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

settingsRouter.get('/resolve', async (req, res, next) => {
  try {
    const query = SettingQuery.parse(req.query);
    const resolved = await settingsService.resolve(req.context.tenantId, query);
    res.json(resolved);
  } catch (err) {
    next(err);
  }
});

// POST and PUT both resolve to upsert — key+scopeType+scopeId is the natural key
settingsRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const body = UpsertSettingRequest.parse(req.body);
    await settingsService.upsert(req.context.tenantId, body);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

settingsRouter.put('/', requireAdmin, async (req, res, next) => {
  try {
    const body = UpsertSettingRequest.parse(req.body);
    await settingsService.upsert(req.context.tenantId, body);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
