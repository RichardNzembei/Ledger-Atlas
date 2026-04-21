import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@inventory/domain/errors';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRoles = req.context?.roles ?? [];
    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      next(new UnauthorizedError(`Requires one of: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole('admin', 'super_admin')(req, res, next);
}
