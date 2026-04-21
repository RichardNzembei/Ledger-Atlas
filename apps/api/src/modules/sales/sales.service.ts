import { and, eq, inArray, sql } from 'drizzle-orm';
import { sales, saleItems, payments, products, stockOnHand } from '@inventory/db/schema';
import { NotFoundError, ConflictError, InsufficientStockError, ValidationError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import { StockAggregate } from '@inventory/domain/stock';
import type { StockEvent } from '@inventory/domain/stock';
import type {
  CreateSaleRequest,
  CompleteSaleRequest,
  VoidSaleRequest,
  ReturnItemsRequest,
  SaleListQuery,
} from '@inventory/contracts/sales';
import { db } from '../../infra/db.js';
import { eventStore } from '../../infra/eventStore.js';
import { eventBus } from '../../infra/eventBus.js';
import { EventTypes } from '@inventory/events';
import { checkValidation } from '../../infra/ruleEnforcer.js';

const STOCK_STREAM = 'stock';

export class SalesService {
  async createSale(tenantId: Buffer, body: CreateSaleRequest, cashierId: Buffer) {
    const id = uuidToBinary(uuidv7());
    const locationIdBuf = uuidToBinary(body.locationId);
    const customerId = body.customerId ? uuidToBinary(body.customerId) : null;

    const productIds = body.items.map((i) => uuidToBinary(i.productId));
    const productRows = await db
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenantId), inArray(products.id, productIds)));

    const productMap = new Map(productRows.map((p) => [binaryToUuid(p.id as Buffer), p]));

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const itemInserts: (typeof saleItems.$inferInsert)[] = [];
    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundError('Product', item.productId);

      const unitPrice = item.unitPrice ?? Number(product.basePrice);
      const costPrice = Number(product.costPrice);
      const discountPct = item.discountPct ?? 0;

      // Look up available stock for this item at the sale location
      const [sohRow] = await db
        .select({ quantity: stockOnHand.quantity, reserved: stockOnHand.reserved })
        .from(stockOnHand)
        .where(and(eq(stockOnHand.tenantId, tenantId), eq(stockOnHand.productId, uuidToBinary(item.productId)), eq(stockOnHand.locationId, locationIdBuf)))
        .limit(1);
      const availableQty = sohRow ? Number(sohRow.quantity) - Number(sohRow.reserved) : 0;
      const resultingQty = availableQty - item.quantity;

      // sale_line validation rules: negative stock (recipe 4), negative margin (recipe 9)
      const violations = await checkValidation(tenantId, 'sale_line', 'create', {
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: unitPrice,
        available_quantity: availableQty,
        resulting_quantity: resultingQty,
        'product.cost_price': costPrice,
        'product.name': product.name,
        'product.sku': product.sku,
        'location.id': body.locationId,
      });
      if (violations.length > 0) {
        const v = violations[0]!;
        throw new ValidationError(v.errorMessage ?? 'Sale line validation failed', v.errorCode ? { rule: v.errorCode } : undefined);
      }

      const discountAmt = (unitPrice * item.quantity * discountPct) / 100;
      // 16% VAT if product has a tax class, else 0
      const taxPct = product.taxClass ? 16 : 0;
      const priceAfterDiscount = unitPrice * item.quantity - discountAmt;
      const taxAmt = (priceAfterDiscount * taxPct) / 100;
      const lineTotal = priceAfterDiscount + taxAmt;

      subtotal += unitPrice * item.quantity;
      discountTotal += discountAmt;
      taxTotal += taxAmt;

      itemInserts.push({
        id: uuidToBinary(uuidv7()),
        saleId: id,
        tenantId,
        productId: uuidToBinary(item.productId),
        quantity: String(item.quantity),
        unitPrice: String(unitPrice),
        discountPct: String(discountPct),
        discountAmt: String(discountAmt),
        taxPct: String(taxPct),
        taxAmt: String(taxAmt),
        lineTotal: String(lineTotal),
        notes: item.notes ?? null,
      });
    }

    const total = subtotal - discountTotal + taxTotal;
    const saleNumber = await this.nextSaleNumber(tenantId);

    await db.transaction(async (tx) => {
      await tx.insert(sales).values({
        id,
        tenantId,
        saleNumber,
        locationId: locationIdBuf,
        customerId,
        cashierId,
        status: 'open',
        subtotal: String(subtotal),
        discountTotal: String(discountTotal),
        taxTotal: String(taxTotal),
        total: String(total),
        paid: '0',
        changeGiven: '0',
        currency: 'KES',
        notes: body.notes ?? null,
        metadata: {},
      });
      if (itemInserts.length > 0) await tx.insert(saleItems).values(itemInserts);
    });

    eventBus.publish({
      type: EventTypes.SALE_CREATED,
      tenantId,
      payload: { saleId: binaryToUuid(id), saleNumber, locationId: body.locationId, total },
      metadata: { userId: cashierId },
      occurredAt: new Date(),
    });

    return this.getSale(tenantId, id);
  }

  async completeSale(tenantId: Buffer, body: CompleteSaleRequest, cashierId: Buffer) {
    const id = uuidToBinary(body.saleId);
    const sale = await this.requireSale(tenantId, id);

    if (sale.status !== 'open') {
      throw new ConflictError(`Sale is already ${sale.status}`);
    }

    const paidTotal = body.payments.reduce((s, p) => s + p.amount, 0);
    const saleTotal = Number(sale.total);
    if (paidTotal < saleTotal) {
      throw new ConflictError(
        `Insufficient payment: required ${saleTotal.toFixed(2)}, received ${paidTotal.toFixed(2)}`,
      );
    }
    const changeGiven = paidTotal - saleTotal;

    // Load items to deduct stock
    const itemRows = await db
      .select()
      .from(saleItems)
      .where(and(eq(saleItems.saleId, id), eq(saleItems.tenantId, tenantId)));

    // Verify stock availability and deduct via event store
    for (const item of itemRows) {
      const productIdBuf = item.productId as Buffer;
      const locationIdBuf = sale.locationId as Buffer;
      const qty = Number(item.quantity);
      const locationId = binaryToUuid(locationIdBuf);

      const storedEvents = await eventStore.readStream(tenantId, STOCK_STREAM, productIdBuf);
      const aggregate = StockAggregate.fromHistory(
        storedEvents.map((e) => e.payload as unknown as StockEvent),
      );

      if (!aggregate.canDeduct(locationId, qty)) {
        throw new InsufficientStockError(
          binaryToUuid(productIdBuf),
          locationId,
          aggregate.quantityAt(locationId),
          qty,
        );
      }

      const event: StockEvent = {
        type: 'StockSold',
        productId: binaryToUuid(productIdBuf),
        locationId,
        quantity: qty,
        saleId: body.saleId,
        saleItemId: binaryToUuid(item.id as Buffer),
        at: new Date().toISOString(),
      };
      aggregate.apply(event);

      await eventStore.append({
        tenantId,
        streamType: STOCK_STREAM,
        streamId: productIdBuf,
        expectedVersion: aggregate.version - 1,
        events: [
          {
            type: event.type,
            payload: event as unknown as Record<string, unknown>,
            metadata: { userId: binaryToUuid(cashierId) },
          },
        ],
      });

      // Decrement read-model
      await db.execute(sql`
        UPDATE stock_on_hand
        SET quantity = GREATEST(0, quantity - ${qty})
        WHERE tenant_id = ${tenantId}
          AND product_id = ${productIdBuf}
          AND location_id = ${locationIdBuf}
      `);
    }

    await db.transaction(async (tx) => {
      const paymentInserts = body.payments.map((p) => ({
        id: uuidToBinary(uuidv7()),
        saleId: id,
        tenantId,
        method: p.method,
        amount: String(p.amount),
        reference: p.reference ?? null,
        status: 'confirmed' as const,
        confirmedAt: new Date(),
      }));
      await tx.insert(payments).values(paymentInserts);

      await tx.update(sales).set({
        status: 'completed',
        paid: String(paidTotal),
        changeGiven: String(changeGiven),
        completedAt: new Date(),
      }).where(eq(sales.id, id));
    });

    eventBus.publish({
      type: EventTypes.SALE_COMPLETED,
      tenantId,
      payload: { saleId: body.saleId, paid: paidTotal, changeGiven },
      metadata: { userId: cashierId },
      occurredAt: new Date(),
    });

    return this.getSale(tenantId, id);
  }

  async voidSale(tenantId: Buffer, body: VoidSaleRequest, userId: Buffer) {
    const id = uuidToBinary(body.saleId);
    const sale = await this.requireSale(tenantId, id);

    if (sale.status !== 'open') {
      throw new ConflictError(`Cannot void a sale with status '${sale.status}'`);
    }

    await db.update(sales)
      .set({ status: 'voided', metadata: { voidReason: body.reason } })
      .where(eq(sales.id, id));

    eventBus.publish({
      type: EventTypes.SALE_VOIDED,
      tenantId,
      payload: { saleId: body.saleId, reason: body.reason },
      metadata: { userId },
      occurredAt: new Date(),
    });

    return { ok: true };
  }

  async returnItems(tenantId: Buffer, body: ReturnItemsRequest, userId: Buffer) {
    const saleId = uuidToBinary(body.saleId);
    const sale = await this.requireSale(tenantId, saleId);

    if (sale.status !== 'completed' && sale.status !== 'partially_refunded') {
      throw new ConflictError(`Cannot return items on a sale with status '${sale.status}'`);
    }

    const returnItemIds = body.items.map((i) => uuidToBinary(i.saleItemId));
    const itemRows = await db
      .select()
      .from(saleItems)
      .where(and(eq(saleItems.saleId, saleId), inArray(saleItems.id, returnItemIds)));

    const itemMap = new Map(itemRows.map((r) => [binaryToUuid(r.id as Buffer), r]));

    let refundTotal = 0;

    for (const ret of body.items) {
      const item = itemMap.get(ret.saleItemId);
      if (!item) throw new NotFoundError('SaleItem', ret.saleItemId);
      if (ret.quantity > Number(item.quantity)) {
        throw new ConflictError(`Return quantity ${ret.quantity} exceeds sold quantity ${item.quantity}`);
      }

      const unitPrice = Number(item.unitPrice);
      const discountPct = Number(item.discountPct);
      const taxPct = Number(item.taxPct);
      const priceAfterDiscount = unitPrice * ret.quantity * (1 - discountPct / 100);
      const refundLine = priceAfterDiscount * (1 + taxPct / 100);
      refundTotal += refundLine;

      // Restore stock
      const locationIdBuf = sale.locationId as Buffer;
      const productIdBuf = item.productId as Buffer;
      const locationId = binaryToUuid(locationIdBuf);

      const storedEvents = await eventStore.readStream(tenantId, STOCK_STREAM, productIdBuf);
      const aggregate = StockAggregate.fromHistory(
        storedEvents.map((e) => e.payload as unknown as StockEvent),
      );

      const event: StockEvent = {
        type: 'StockReturned',
        productId: binaryToUuid(productIdBuf),
        locationId,
        quantity: ret.quantity,
        saleId: body.saleId,
        reason: ret.reason,
        at: new Date().toISOString(),
      };
      aggregate.apply(event);

      await eventStore.append({
        tenantId,
        streamType: STOCK_STREAM,
        streamId: productIdBuf,
        expectedVersion: aggregate.version - 1,
        events: [
          {
            type: event.type,
            payload: event as unknown as Record<string, unknown>,
            metadata: { userId: binaryToUuid(userId) },
          },
        ],
      });

      await db.execute(sql`
        INSERT INTO stock_on_hand (id, tenant_id, product_id, location_id, quantity, reserved)
        VALUES (${uuidToBinary(uuidv7())}, ${tenantId}, ${productIdBuf}, ${locationIdBuf}, ${ret.quantity}, 0)
        ON DUPLICATE KEY UPDATE quantity = quantity + ${ret.quantity}
      `);
    }

    // Determine new sale status
    const allItemsReturned = body.items.every((ret) => {
      const item = itemMap.get(ret.saleItemId);
      return item && ret.quantity >= Number(item.quantity);
    });
    const allSaleItemsReturned = allItemsReturned && body.items.length === itemRows.length;
    const newStatus = allSaleItemsReturned ? 'refunded' : 'partially_refunded';

    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        id: uuidToBinary(uuidv7()),
        saleId,
        tenantId,
        method: body.refundMethod,
        amount: String(-refundTotal),
        reference: `REFUND-${body.saleId.slice(0, 8)}`,
        status: 'refunded',
        confirmedAt: new Date(),
      });
      await tx.update(sales).set({ status: newStatus }).where(eq(sales.id, saleId));
    });

    eventBus.publish({
      type: EventTypes.STOCK_RETURNED,
      tenantId,
      payload: { saleId: body.saleId, refundTotal, status: newStatus },
      metadata: { userId },
      occurredAt: new Date(),
    });

    return { ok: true, refundTotal, status: newStatus };
  }

  async listSales(tenantId: Buffer, query: SaleListQuery) {
    const conditions = [eq(sales.tenantId, tenantId)];
    if (query.locationId) conditions.push(eq(sales.locationId, uuidToBinary(query.locationId)));
    if (query.customerId) conditions.push(eq(sales.customerId, uuidToBinary(query.customerId)));
    if (query.status) conditions.push(eq(sales.status, query.status));
    if (query.dateFrom)
      conditions.push(sql`DATE(${sales.createdAt}) >= ${query.dateFrom}`);
    if (query.dateTo)
      conditions.push(sql`DATE(${sales.createdAt}) <= ${query.dateTo}`);

    const rows = await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(sql`${sales.createdAt} DESC`)
      .limit(query.limit)
      .offset(query.offset);

    return Promise.all(rows.map((r) => this.getSale(tenantId, r.id as Buffer)));
  }

  async getSale(tenantId: Buffer, id: Buffer) {
    const [saleRow] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.tenantId, tenantId)))
      .limit(1);
    if (!saleRow) throw new NotFoundError('Sale', binaryToUuid(id));

    const itemRows = await db
      .select({ item: saleItems, product: products })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(and(eq(saleItems.saleId, id), eq(saleItems.tenantId, tenantId)));

    return {
      id: binaryToUuid(saleRow.id as Buffer),
      tenantId: binaryToUuid(saleRow.tenantId as Buffer),
      saleNumber: saleRow.saleNumber,
      locationId: binaryToUuid(saleRow.locationId as Buffer),
      customerId: saleRow.customerId ? binaryToUuid(saleRow.customerId as Buffer) : null,
      cashierId: binaryToUuid(saleRow.cashierId as Buffer),
      status: saleRow.status,
      subtotal: Number(saleRow.subtotal),
      discountTotal: Number(saleRow.discountTotal),
      taxTotal: Number(saleRow.taxTotal),
      total: Number(saleRow.total),
      paid: Number(saleRow.paid),
      changeGiven: Number(saleRow.changeGiven),
      currency: saleRow.currency,
      notes: saleRow.notes ?? null,
      completedAt: saleRow.completedAt?.toISOString() ?? null,
      createdAt: saleRow.createdAt.toISOString(),
      updatedAt: saleRow.updatedAt.toISOString(),
      items: itemRows.map(({ item, product }) => ({
        id: binaryToUuid(item.id as Buffer),
        productId: binaryToUuid(item.productId as Buffer),
        productName: product?.name ?? '',
        productSku: product?.sku ?? '',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPct: Number(item.discountPct),
        discountAmt: Number(item.discountAmt),
        taxPct: Number(item.taxPct),
        taxAmt: Number(item.taxAmt),
        lineTotal: Number(item.lineTotal),
        notes: item.notes ?? null,
      })),
    };
  }

  private async requireSale(tenantId: Buffer, id: Buffer) {
    const [row] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.tenantId, tenantId)))
      .limit(1);
    if (!row) throw new NotFoundError('Sale', binaryToUuid(id));
    return row;
  }

  private async nextSaleNumber(tenantId: Buffer): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [row] = await db
      .select({ cnt: sql<number>`COUNT(*)` })
      .from(sales)
      .where(
        and(
          eq(sales.tenantId, tenantId),
          sql`DATE_FORMAT(${sales.createdAt}, '%Y%m') = ${ym}`,
        ),
      );
    const seq = String((Number(row?.cnt ?? 0) + 1)).padStart(5, '0');
    return `SL-${ym}-${seq}`;
  }
}

export const salesService = new SalesService();
