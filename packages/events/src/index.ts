import { EventEmitter } from 'node:events';

export interface DomainEvent<T = Record<string, unknown>> {
  type: string;
  tenantId: Buffer;
  streamType?: string;
  streamId?: Buffer;
  payload: T;
  metadata: {
    userId?: Buffer;
    correlationId?: string;
    causationId?: string;
  };
  occurredAt: Date;
}

type EventHandler<T = unknown> = (event: DomainEvent<Record<string, unknown> & T>) => void | Promise<void>;

export class EventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  publish(event: DomainEvent): void {
    const e = { ...event, occurredAt: event.occurredAt ?? new Date() };
    this.emitter.emit(event.type, e);
    this.emitter.emit('*', e);
  }

  subscribe(eventType: string, handler: EventHandler): () => void {
    const wrapper = (event: DomainEvent) => {
      Promise.resolve(handler(event as DomainEvent<Record<string, unknown>>)).catch((err: unknown) => {
        console.error(`[EventBus] handler failed for ${eventType}:`, err);
      });
    };
    this.emitter.on(eventType, wrapper);
    return () => this.emitter.off(eventType, wrapper);
  }

  subscribeAll(handler: EventHandler): () => void {
    return this.subscribe('*', handler);
  }

  once(eventType: string, handler: EventHandler): void {
    const wrapper = (event: DomainEvent) => {
      Promise.resolve(handler(event as DomainEvent<Record<string, unknown>>)).catch((err: unknown) => {
        console.error(`[EventBus] once handler failed for ${eventType}:`, err);
      });
    };
    this.emitter.once(eventType, wrapper);
  }
}

// Well-known event type strings
export const EventTypes = {
  // Stock
  STOCK_RECEIVED: 'stock.received',
  STOCK_SOLD: 'stock.sold',
  STOCK_TRANSFERRED: 'stock.transferred',
  STOCK_ADJUSTED: 'stock.adjusted',
  STOCK_RETURNED: 'stock.returned',
  STOCK_BELOW_REORDER: 'stock.below_reorder',

  // Sales
  SALE_CREATED: 'sale.created',
  SALE_COMPLETED: 'sale.completed',
  SALE_VOIDED: 'sale.voided',

  // Assets
  ASSET_CREATED: 'asset.created',
  ASSET_ASSIGNED: 'asset.assigned',
  ASSET_MAINTENANCE: 'asset.maintenance_started',
  ASSET_DISPOSED: 'asset.disposed',

  // Payments
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_CONFIRMED: 'payment.confirmed',
  PAYMENT_FAILED: 'payment.failed',

  // Users
  USER_LOGGED_IN: 'user.logged_in',
  USER_CREATED: 'user.created',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];
