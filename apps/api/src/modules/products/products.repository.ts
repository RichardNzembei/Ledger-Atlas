import { and, count, eq, ilike, like, sql } from 'drizzle-orm';
import { products, productExtensions } from '@inventory/db/schema';
import { NotFoundError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import type { CreateProductRequest, UpdateProductRequest } from '@inventory/contracts/products';
import { db } from '../../infra/db.js';

export class ProductsRepository {
  async create(tenantId: Buffer, body: CreateProductRequest, _userId: Buffer) {
    const id = uuidToBinary(uuidv7());

    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        id,
        tenantId,
        sku: body.sku,
        name: body.name,
        description: body.description ?? null,
        category: body.category ?? null,
        subcategory: body.subcategory ?? null,
        unitOfMeasure: body.unitOfMeasure ?? 'unit',
        basePrice: String(body.basePrice),
        costPrice: String(body.costPrice),
        taxClass: body.taxClass ?? null,
        trackLots: body.trackLots ?? false,
        trackSerials: body.trackSerials ?? false,
        reorderPoint: body.reorderPoint != null ? String(body.reorderPoint) : null,
        reorderQty: body.reorderQty != null ? String(body.reorderQty) : null,
        isActive: true,
      });

      await tx.insert(productExtensions).values({
        productId: id,
        tenantId,
        custom: body.customFields ?? {},
      });
    });

    return this.findById(tenantId, binaryToUuid(id));
  }

  async findById(tenantId: Buffer, id: string) {
    const idBuf = uuidToBinary(id);
    const rows = await db
      .select()
      .from(products)
      .leftJoin(productExtensions, eq(products.id, productExtensions.productId))
      .where(and(eq(products.id, idBuf), eq(products.tenantId, tenantId)))
      .limit(1);

    const row = rows[0];
    if (!row) throw new NotFoundError('Product', id);
    return this.toResponse(row);
  }

  async list(
    tenantId: Buffer,
    opts: { limit: number; offset: number; search?: string; category?: string; isActive?: boolean },
  ) {
    const conditions = [eq(products.tenantId, tenantId)];
    if (opts.search) {
      conditions.push(
        sql`(${products.name} LIKE ${`%${opts.search}%`} OR ${products.sku} LIKE ${`%${opts.search}%`})`,
      );
    }
    if (opts.category) conditions.push(eq(products.category, opts.category));
    if (opts.isActive !== undefined) conditions.push(eq(products.isActive, opts.isActive));

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      db
        .select()
        .from(products)
        .leftJoin(productExtensions, eq(products.id, productExtensions.productId))
        .where(where)
        .limit(opts.limit)
        .offset(opts.offset),
      db.select({ count: count() }).from(products).where(where),
    ]);

    return {
      items: rows.map((r) => this.toResponse(r)),
      total: Number(countRow?.count ?? 0),
      limit: opts.limit,
      offset: opts.offset,
    };
  }

  async update(tenantId: Buffer, id: string, body: UpdateProductRequest) {
    const idBuf = uuidToBinary(id);
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, idBuf), eq(products.tenantId, tenantId)))
      .limit(1);

    if (!existing[0]) throw new NotFoundError('Product', id);

    await db.transaction(async (tx) => {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates['name'] = body.name;
      if (body.description !== undefined) updates['description'] = body.description;
      if (body.category !== undefined) updates['category'] = body.category;
      if (body.subcategory !== undefined) updates['subcategory'] = body.subcategory;
      if (body.unitOfMeasure !== undefined) updates['unitOfMeasure'] = body.unitOfMeasure;
      if (body.basePrice !== undefined) updates['basePrice'] = String(body.basePrice);
      if (body.costPrice !== undefined) updates['costPrice'] = String(body.costPrice);
      if (body.taxClass !== undefined) updates['taxClass'] = body.taxClass;
      if (body.reorderPoint !== undefined)
        updates['reorderPoint'] = body.reorderPoint != null ? String(body.reorderPoint) : null;
      if (body.reorderQty !== undefined)
        updates['reorderQty'] = body.reorderQty != null ? String(body.reorderQty) : null;

      if (Object.keys(updates).length > 0) {
        await tx.update(products).set(updates).where(eq(products.id, idBuf));
      }

      if (body.customFields !== undefined) {
        await tx
          .update(productExtensions)
          .set({ custom: body.customFields })
          .where(eq(productExtensions.productId, idBuf));
      }
    });

    return this.findById(tenantId, id);
  }

  async deactivate(tenantId: Buffer, id: string) {
    const idBuf = uuidToBinary(id);
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, idBuf), eq(products.tenantId, tenantId)))
      .limit(1);

    if (!existing[0]) throw new NotFoundError('Product', id);
    await db.update(products).set({ isActive: false }).where(eq(products.id, idBuf));
  }

  private toResponse(row: {
    products: typeof products.$inferSelect;
    product_extensions: typeof productExtensions.$inferSelect | null;
  }) {
    const p = row.products;
    const ext = row.product_extensions;
    return {
      id: binaryToUuid(p.id as Buffer),
      tenantId: binaryToUuid(p.tenantId as Buffer),
      sku: p.sku,
      name: p.name,
      description: p.description ?? null,
      category: p.category ?? null,
      subcategory: p.subcategory ?? null,
      unitOfMeasure: p.unitOfMeasure,
      basePrice: Number(p.basePrice),
      costPrice: Number(p.costPrice),
      taxClass: p.taxClass ?? null,
      trackLots: p.trackLots,
      trackSerials: p.trackSerials,
      reorderPoint: p.reorderPoint != null ? Number(p.reorderPoint) : null,
      reorderQty: p.reorderQty != null ? Number(p.reorderQty) : null,
      isActive: p.isActive,
      customFields: (ext?.custom as Record<string, unknown>) ?? {},
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

export const productsRepo = new ProductsRepository();
