import { and, eq, sql } from 'drizzle-orm';
import { stockOnHand, products } from '@inventory/db/schema';
import { StockAggregate } from '@inventory/domain/stock';
import { NotFoundError } from '@inventory/domain/errors';
import { uuidv7, uuidToBinary, binaryToUuid } from '@inventory/domain/utils';
import type {
  ReceiveStockRequest,
  TransferStockRequest,
  AdjustStockRequest,
} from '@inventory/contracts/inventory';
import { db } from '../../infra/db.js';
import { eventStore } from '../../infra/eventStore.js';
import { eventBus } from '../../infra/eventBus.js';
import { EventTypes } from '@inventory/events';
import type { StockEvent } from '@inventory/domain/stock';

const STOCK_STREAM = 'stock';

export class InventoryService {
  async receiveStock(tenantId: Buffer, body: ReceiveStockRequest, userId: Buffer) {
    for (const item of body.items) {
      const productIdBuf = uuidToBinary(item.productId);
      const locationIdBuf = uuidToBinary(body.locationId);

      const { aggregate, version } = await this.loadAggregate(tenantId, productIdBuf);
      const event: StockEvent = {
        type: 'StockReceived',
        productId: item.productId,
        locationId: body.locationId,
        quantity: item.quantity,
        poItemId: body.poItemId,
        at: new Date().toISOString(),
      };

      aggregate.apply(event);

      await eventStore.append({
        tenantId,
        streamType: STOCK_STREAM,
        streamId: productIdBuf,
        expectedVersion: version,
        events: [
          {
            type: event.type,
            payload: event as unknown as Record<string, unknown>,
            metadata: { userId: binaryToUuid(userId) },
          },
        ],
      });

      await this.upsertStockOnHand(tenantId, productIdBuf, locationIdBuf, item.quantity);

      const reorderPoint = await this.getReorderPoint(tenantId, productIdBuf);
      const newQty = aggregate.quantityAt(body.locationId);

      eventBus.publish({
        type: EventTypes.STOCK_RECEIVED,
        tenantId,
        payload: event as unknown as Record<string, unknown>,
        metadata: { userId },
        occurredAt: new Date(),
      });

      if (reorderPoint !== null && newQty <= reorderPoint) {
        eventBus.publish({
          type: EventTypes.STOCK_BELOW_REORDER,
          tenantId,
          payload: { productId: item.productId, locationId: body.locationId, quantity: newQty, reorderPoint },
          metadata: { userId },
          occurredAt: new Date(),
        });
      }
    }
  }

  async transferStock(tenantId: Buffer, body: TransferStockRequest, userId: Buffer) {
    for (const item of body.items) {
      const productIdBuf = uuidToBinary(item.productId);
      const fromBuf = uuidToBinary(body.fromLocationId);
      const toBuf = uuidToBinary(body.toLocationId);

      const { aggregate, version } = await this.loadAggregate(tenantId, productIdBuf);
      const event: StockEvent = {
        type: 'StockTransferred',
        productId: item.productId,
        fromLocationId: body.fromLocationId,
        toLocationId: body.toLocationId,
        quantity: item.quantity,
        at: new Date().toISOString(),
      };

      aggregate.apply(event);

      await eventStore.append({
        tenantId,
        streamType: STOCK_STREAM,
        streamId: productIdBuf,
        expectedVersion: version,
        events: [
          {
            type: event.type,
            payload: event as unknown as Record<string, unknown>,
            metadata: { userId: binaryToUuid(userId) },
          },
        ],
      });

      await this.upsertStockOnHand(tenantId, productIdBuf, fromBuf, -item.quantity);
      await this.upsertStockOnHand(tenantId, productIdBuf, toBuf, item.quantity);

      eventBus.publish({
        type: EventTypes.STOCK_TRANSFERRED,
        tenantId,
        payload: event as unknown as Record<string, unknown>,
        metadata: { userId },
        occurredAt: new Date(),
      });
    }
  }

  async adjustStock(tenantId: Buffer, body: AdjustStockRequest, userId: Buffer) {
    for (const item of body.items) {
      const productIdBuf = uuidToBinary(item.productId);
      const locationIdBuf = uuidToBinary(body.locationId);

      const { aggregate, version } = await this.loadAggregate(tenantId, productIdBuf);
      const systemQty = aggregate.quantityAt(body.locationId);
      const delta = item.countedQty - systemQty;

      const event: StockEvent = {
        type: 'StockAdjusted',
        productId: item.productId,
        locationId: body.locationId,
        delta,
        reason: item.reason,
        countedQty: item.countedQty,
        systemQty,
        at: new Date().toISOString(),
      };

      aggregate.apply(event);

      await eventStore.append({
        tenantId,
        streamType: STOCK_STREAM,
        streamId: productIdBuf,
        expectedVersion: version,
        events: [
          {
            type: event.type,
            payload: event as unknown as Record<string, unknown>,
            metadata: { userId: binaryToUuid(userId) },
          },
        ],
      });

      await this.upsertStockOnHand(tenantId, productIdBuf, locationIdBuf, delta);

      eventBus.publish({
        type: EventTypes.STOCK_ADJUSTED,
        tenantId,
        payload: event as unknown as Record<string, unknown>,
        metadata: { userId },
        occurredAt: new Date(),
      });
    }
  }

  async getStockLevels(
    tenantId: Buffer,
    opts: { locationId?: string; productId?: string; limit: number; offset: number },
  ) {
    const conditions = [eq(stockOnHand.tenantId, tenantId)];
    if (opts.locationId) conditions.push(eq(stockOnHand.locationId, uuidToBinary(opts.locationId)));
    if (opts.productId) conditions.push(eq(stockOnHand.productId, uuidToBinary(opts.productId)));

    const rows = await db
      .select()
      .from(stockOnHand)
      .where(and(...conditions))
      .limit(opts.limit)
      .offset(opts.offset);

    return rows.map((r) => ({
      productId: binaryToUuid(r.productId as Buffer),
      locationId: binaryToUuid(r.locationId as Buffer),
      quantity: Number(r.quantity),
      reserved: Number(r.reserved),
      available: Number(r.quantity) - Number(r.reserved),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /** Replay all events for a product stream and return current state — for time-travel debugging */
  async replayStream(tenantId: Buffer, productId: string) {
    const productIdBuf = uuidToBinary(productId);
    const storedEvents = await eventStore.readStream(tenantId, STOCK_STREAM, productIdBuf);
    const aggregate = StockAggregate.fromHistory(
      storedEvents.map((e) => e.payload as unknown as StockEvent),
    );
    return {
      productId,
      version: aggregate.version,
      snapshot: aggregate.snapshot(),
      eventCount: storedEvents.length,
      events: storedEvents.map((e) => ({
        version: e.version,
        type: e.eventType,
        payload: e.payload,
        occurredAt: e.occurredAt,
      })),
    };
  }

  private async loadAggregate(tenantId: Buffer, productIdBuf: Buffer) {
    const storedEvents = await eventStore.readStream(tenantId, STOCK_STREAM, productIdBuf);
    const domainEvents = storedEvents.map((e) => e.payload as unknown as StockEvent);
    const aggregate = StockAggregate.fromHistory(domainEvents);
    return { aggregate, version: aggregate.version };
  }

  /**
   * Atomic upsert: insert new row with quantity=delta, or add delta to existing quantity.
   * Uses raw MySQL ON DUPLICATE KEY UPDATE for atomicity — Drizzle's upsert doesn't
   * support expression-based updates on conflict keys.
   */
  private async upsertStockOnHand(
    tenantId: Buffer,
    productId: Buffer,
    locationId: Buffer,
    delta: number,
  ) {
    const id = uuidToBinary(uuidv7());
    const initialQty = Math.max(0, delta);

    await db.execute(sql`
      INSERT INTO stock_on_hand (id, tenant_id, product_id, location_id, quantity, reserved)
      VALUES (${id}, ${tenantId}, ${productId}, ${locationId}, ${initialQty}, 0)
      ON DUPLICATE KEY UPDATE
        quantity = GREATEST(0, quantity + ${delta})
    `);
  }

  private async getReorderPoint(tenantId: Buffer, productIdBuf: Buffer): Promise<number | null> {
    const rows = await db
      .select({ reorderPoint: products.reorderPoint })
      .from(products)
      .where(and(eq(products.id, productIdBuf), eq(products.tenantId, tenantId)))
      .limit(1);
    const val = rows[0]?.reorderPoint;
    return val != null ? Number(val) : null;
  }
}

export const inventoryService = new InventoryService();
