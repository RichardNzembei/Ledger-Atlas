import { Router } from 'express';
import { and, count, eq, sql } from 'drizzle-orm';
import { customers, customerExtensions } from '@inventory/db/schema';
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerListQuery,
} from '@inventory/contracts/customers';
import { NotFoundError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import { db } from '../../infra/db.js';

export const customersRouter = Router();

customersRouter.get('/', async (req, res, next) => {
  try {
    const query = CustomerListQuery.parse(req.query);
    const tenantId = req.context.tenantId;

    const conditions = [eq(customers.tenantId, tenantId)];
    if (query.search)
      conditions.push(sql`(${customers.name} LIKE ${`%${query.search}%`} OR ${customers.phone} LIKE ${`%${query.search}%`})`);
    if (query.segment) conditions.push(eq(customers.segment, query.segment));
    if (query.isActive !== undefined) conditions.push(eq(customers.isActive, query.isActive));

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      db
        .select()
        .from(customers)
        .leftJoin(customerExtensions, eq(customers.id, customerExtensions.customerId))
        .where(where)
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: count() }).from(customers).where(where),
    ]);

    res.json({
      items: rows.map((r) => toResponse(r)),
      total: Number(countRow?.count ?? 0),
      limit: query.limit,
      offset: query.offset,
    });
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/', async (req, res, next) => {
  try {
    const body = CreateCustomerRequest.parse(req.body);
    const tenantId = req.context.tenantId;
    const id = uuidToBinary(uuidv7());

    await db.transaction(async (tx) => {
      await tx.insert(customers).values({
        id,
        tenantId,
        code: body.code ?? null,
        name: body.name,
        email: body.email?.toLowerCase() ?? null,
        phone: body.phone ?? null,
        segment: body.segment ?? 'retail',
        creditLimit: String(body.creditLimit ?? 0),
        balance: '0',
        address: body.address ?? null,
        notes: body.notes ?? null,
        isActive: true,
      });
      await tx.insert(customerExtensions).values({
        customerId: id,
        tenantId,
        custom: body.customFields ?? {},
      });
    });

    const rows = await db
      .select()
      .from(customers)
      .leftJoin(customerExtensions, eq(customers.id, customerExtensions.customerId))
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    res.status(201).json(toResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

customersRouter.get('/:id', async (req, res, next) => {
  try {
    const id = uuidToBinary(req.params['id']!);
    const rows = await db
      .select()
      .from(customers)
      .leftJoin(customerExtensions, eq(customers.id, customerExtensions.customerId))
      .where(and(eq(customers.id, id), eq(customers.tenantId, req.context.tenantId)))
      .limit(1);

    if (!rows[0]) throw new NotFoundError('Customer', req.params['id']!);
    res.json(toResponse(rows[0]));
  } catch (err) {
    next(err);
  }
});

customersRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = uuidToBinary(req.params['id']!);
    const tenantId = req.context.tenantId;
    const body = UpdateCustomerRequest.parse(req.body);

    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (!existing[0]) throw new NotFoundError('Customer', req.params['id']!);

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates['name'] = body.name;
    if (body.email !== undefined) updates['email'] = body.email?.toLowerCase();
    if (body.phone !== undefined) updates['phone'] = body.phone;
    if (body.segment !== undefined) updates['segment'] = body.segment;
    if (body.creditLimit !== undefined) updates['creditLimit'] = String(body.creditLimit);
    if (body.address !== undefined) updates['address'] = body.address;
    if (body.notes !== undefined) updates['notes'] = body.notes;

    await db.transaction(async (tx) => {
      if (Object.keys(updates).length > 0) await tx.update(customers).set(updates).where(eq(customers.id, id));
      if (body.customFields !== undefined)
        await tx.update(customerExtensions).set({ custom: body.customFields }).where(eq(customerExtensions.customerId, id));
    });

    const rows = await db
      .select()
      .from(customers)
      .leftJoin(customerExtensions, eq(customers.id, customerExtensions.customerId))
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    res.json(toResponse(rows[0]!));
  } catch (err) {
    next(err);
  }
});

function toResponse(row: {
  customers: typeof customers.$inferSelect;
  customer_extensions: typeof customerExtensions.$inferSelect | null;
}) {
  const c = row.customers;
  const ext = row.customer_extensions;
  return {
    id: binaryToUuid(c.id as Buffer),
    tenantId: binaryToUuid(c.tenantId as Buffer),
    code: c.code ?? null,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    segment: c.segment,
    creditLimit: Number(c.creditLimit),
    balance: Number(c.balance),
    address: c.address ?? null,
    notes: c.notes ?? null,
    isActive: c.isActive,
    customFields: (ext?.custom as Record<string, unknown>) ?? {},
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
