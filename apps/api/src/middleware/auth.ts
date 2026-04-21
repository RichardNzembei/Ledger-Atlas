import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JwtPayload {
  sub: string;
  tid: string;
  roles: string[];
  email: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayload;
      context: RequestContext;
    }
  }
}

export interface RequestContext {
  userId: Buffer;
  userIdHex: string;
  tenantId: Buffer;
  tenantIdHex: string;
  roles: string[];
  email: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_token', message: 'Authorization header required' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.jwtPayload = payload;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token', message: 'Token is invalid or expired' });
  }
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.jwtPayload) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  const { sub, tid, roles, email } = req.jwtPayload;
  req.context = {
    userId: Buffer.from(sub.replace(/-/g, ''), 'hex'),
    userIdHex: sub.replace(/-/g, ''),
    tenantId: Buffer.from(tid.replace(/-/g, ''), 'hex'),
    tenantIdHex: tid.replace(/-/g, ''),
    roles,
    email,
  };
  next();
}
