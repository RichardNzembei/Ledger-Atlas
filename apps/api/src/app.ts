import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { authMiddleware, tenantMiddleware } from './middleware/auth.js';
import { settingsMiddleware } from './middleware/settings.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.router.js';
import { productsRouter } from './modules/products/products.router.js';
import { inventoryRouter } from './modules/inventory/inventory.router.js';
import { customersRouter } from './modules/customers/customers.router.js';
import { settingsRouter } from './modules/settings/settings.router.js';
import { metadataRouter } from './modules/metadata/metadata.router.js';
import { paymentsRouter } from './modules/payments/payments.router.js';
import { locationsRouter } from './modules/locations/locations.router.js';
import { assetsRouter } from './modules/assets/assets.router.js';
import { salesRouter } from './modules/sales/sales.router.js';
import { auditRouter } from './modules/audit/audit.router.js';
import { config } from './config/index.js';
import { logger } from './infra/logger.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  const allowedOrigins = config.WEB_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization'],
      customLogLevel(_req, res) {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // Health check — no auth
  app.get('/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  // Public: M-Pesa callback (Safaricom calls this with no bearer token)
  app.use('/api/v1/payments', paymentsRouter);

  // Unauthenticated endpoints
  app.use('/api/v1/auth', authRouter);

  // Everything below requires a valid JWT and tenant context
  app.use('/api/v1', authMiddleware, tenantMiddleware, settingsMiddleware);

  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/metadata', metadataRouter);
  app.use('/api/v1/locations', locationsRouter);
  app.use('/api/v1/assets', assetsRouter);
  app.use('/api/v1/sales', salesRouter);
  app.use('/api/v1/audit-log', auditRouter);

  app.use(errorHandler);

  return app;
}
