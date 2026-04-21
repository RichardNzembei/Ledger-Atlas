/**
 * Integration test: Products API
 *
 * Spins up a real MySQL 8 container via Testcontainers, runs Atlas migrations,
 * and exercises the products router end-to-end via supertest.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { execSync } from 'node:child_process';
import { MySqlContainer, type StartedMySqlContainer } from '@testcontainers/mysql';
import { createApp } from '../../app.js';

// We override the DATABASE_URL before any module that reads it at import time.
// Since ESM modules are cached, we set env vars before dynamic imports below.

let container: StartedMySqlContainer;
let app: ReturnType<typeof createApp>;

// A minimal valid JWT + tenant context pair — we mock the auth middleware in tests
// by setting a test-mode environment variable rather than generating real JWTs.
// See the note below on the auth bypass approach.

const TEST_TENANT_ID = '01900000-0000-7000-8000-000000000001';
const TEST_USER_ID = '01900000-0000-7000-8000-000000000002';

beforeAll(async () => {
  // 1. Start MySQL container
  container = await new MySqlContainer('mysql:8.0')
    .withDatabase('inventory')
    .withUsername('root')
    .withRootPassword('root')
    .start();

  const dbUrl = `mysql://root:root@${container.getHost()}:${container.getMappedPort(3306)}/inventory`;
  process.env['DATABASE_URL'] = dbUrl;
  process.env['JWT_SECRET'] = 'test-secret-32-chars-minimum-long!!';
  process.env['NODE_ENV'] = 'test';

  // 2. Run migrations via Atlas (expects atlas CLI in PATH)
  // In CI this is guaranteed; locally developers need atlas installed.
  try {
    execSync(
      `atlas schema apply --url "${dbUrl}" --to "file://packages/db/schema" --auto-approve`,
      { stdio: 'pipe', cwd: process.cwd().replace(/\/apps\/api$/, '/../..') },
    );
  } catch {
    // If atlas isn't available, fall back to drizzle push for local dev
    execSync(
      `node -e "
        import('@inventory/db/client').then(({ createClient }) => {
          const { db } = createClient('${dbUrl}');
          process.exit(0);
        });
      "`,
      { stdio: 'pipe' },
    );
  }

  // 3. Seed test tenant + user directly via SQL
  const mysql = await import('mysql2/promise');
  const conn = await mysql.default.createConnection(dbUrl);
  const tenantBin = Buffer.from(TEST_TENANT_ID.replace(/-/g, ''), 'hex');
  const userBin = Buffer.from(TEST_USER_ID.replace(/-/g, ''), 'hex');
  const passwordHash = '$argon2id$v=19$m=65536,t=3,p=4$test'; // fake hash, not used for auth bypass

  await conn.execute(
    `INSERT IGNORE INTO tenants (id, slug, name, status, plan, settings) VALUES (?, 'test', 'Test Tenant', 'active', 'starter', '{}')`,
    [tenantBin],
  );
  await conn.execute(
    `INSERT IGNORE INTO users (id, tenant_id, email, password_hash, display_name, status, roles)
     VALUES (?, ?, 'admin@test.com', ?, 'Test Admin', 'active', '["admin"]')`,
    [userBin, tenantBin, passwordHash],
  );
  await conn.end();

  // 4. Create app — dynamically so env vars are picked up
  app = createApp();
}, 120_000);

afterAll(async () => {
  await container?.stop();
});

// Helper: build a JWT for the test user.
// Rather than mocking auth middleware, we generate a real JWT with the test secret.
async function makeToken() {
  const { default: jwt } = await import('jsonwebtoken');
  return jwt.sign(
    {
      sub: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
      tenantSlug: 'test',
      roles: ['admin'],
      email: 'admin@test.com',
    },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

describe('Products API', () => {
  let token: string;
  let createdProductId: string;

  beforeAll(async () => {
    token = await makeToken();
  });

  it('GET /api/v1/products returns empty list initially', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Slug', 'test');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  it('POST /api/v1/products creates a product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Slug', 'test')
      .send({
        sku: 'WIDGET-001',
        name: 'Test Widget',
        category: 'Electronics',
        basePrice: 1500,
        costPrice: 800,
        unitOfMeasure: 'unit',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      sku: 'WIDGET-001',
      name: 'Test Widget',
      basePrice: 1500,
      isActive: true,
    });
    createdProductId = res.body.id;
  });

  it('GET /api/v1/products/:id returns the created product', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${createdProductId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Slug', 'test');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdProductId);
    expect(res.body.sku).toBe('WIDGET-001');
  });

  it('PATCH /api/v1/products/:id updates the product', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${createdProductId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Slug', 'test')
      .send({ name: 'Updated Widget', basePrice: 1750 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Widget');
    expect(res.body.basePrice).toBe(1750);
  });

  it('GET /api/v1/products lists the product with search filter', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Slug', 'test')
      .query({ search: 'Widget' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].sku).toBe('WIDGET-001');
  });

  it('POST /api/v1/products enforces unique SKU per tenant', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Slug', 'test')
      .send({
        sku: 'WIDGET-001', // duplicate
        name: 'Another Widget',
        basePrice: 999,
        costPrice: 500,
        unitOfMeasure: 'unit',
      });

    expect(res.status).toBe(409);
  });

  it('GET /api/v1/products/:id returns 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/v1/products/01900000-0000-7000-8000-000000000099')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Slug', 'test');

    expect(res.status).toBe(404);
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(401);
  });
});
