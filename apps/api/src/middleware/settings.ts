import type { Request, Response, NextFunction } from 'express';
import { settingsService } from '../modules/settings/settings.service.js';

declare global {
  namespace Express {
    interface Request {
      /** Lazily resolved settings for the current request's tenant + optional scope. */
      resolveSettings(opts?: { scopeType?: 'tenant' | 'location' | 'user'; scopeId?: string; prefix?: string }): Promise<Record<string, unknown>>;
    }
  }
}

/**
 * Attaches a `resolveSettings()` helper to every authenticated request.
 * Callers can request tenant-wide or scope-narrowed settings on demand.
 * Results are memoised per (scopeType, scopeId, prefix) key within the request lifecycle.
 */
export function settingsMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const cache = new Map<string, Promise<Record<string, unknown>>>();

  req.resolveSettings = (opts = {}) => {
    const cacheKey = `${opts.scopeType ?? ''}:${opts.scopeId ?? ''}:${opts.prefix ?? ''}`;
    if (!cache.has(cacheKey)) {
      cache.set(
        cacheKey,
        settingsService.resolve(req.context.tenantId, opts),
      );
    }
    return cache.get(cacheKey)!;
  };

  next();
}
