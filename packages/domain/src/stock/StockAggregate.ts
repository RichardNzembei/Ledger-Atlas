import { InsufficientStockError } from '../errors.js';

export type StockEvent =
  | {
      type: 'StockReceived';
      productId: string;
      locationId: string;
      quantity: number;
      poItemId?: string;
      at: string;
    }
  | {
      type: 'StockSold';
      productId: string;
      locationId: string;
      quantity: number;
      saleId: string;
      saleItemId: string;
      at: string;
    }
  | {
      type: 'StockTransferred';
      productId: string;
      fromLocationId: string;
      toLocationId: string;
      quantity: number;
      referenceId?: string;
      at: string;
    }
  | {
      type: 'StockAdjusted';
      productId: string;
      locationId: string;
      delta: number;
      reason: string;
      countedQty: number;
      systemQty: number;
      at: string;
    }
  | {
      type: 'StockReturned';
      productId: string;
      locationId: string;
      quantity: number;
      saleId: string;
      reason: string;
      at: string;
    };

export class StockAggregate {
  private quantityByLocation = new Map<string, number>();
  public version = 0;

  static fromHistory(events: StockEvent[]): StockAggregate {
    const agg = new StockAggregate();
    for (const e of events) agg.apply(e);
    return agg;
  }

  apply(event: StockEvent): void {
    this.version++;
    switch (event.type) {
      case 'StockReceived':
        this.add(event.locationId, event.quantity);
        break;
      case 'StockSold':
        this.deduct(event.locationId, event.quantity, event.productId);
        break;
      case 'StockTransferred':
        this.deduct(event.fromLocationId, event.quantity, event.productId);
        this.add(event.toLocationId, event.quantity);
        break;
      case 'StockAdjusted':
        this.add(event.locationId, event.delta);
        break;
      case 'StockReturned':
        this.add(event.locationId, event.quantity);
        break;
    }
  }

  canDeduct(locationId: string, quantity: number): boolean {
    return (this.quantityByLocation.get(locationId) ?? 0) >= quantity;
  }

  quantityAt(locationId: string): number {
    return this.quantityByLocation.get(locationId) ?? 0;
  }

  totalQuantity(): number {
    let total = 0;
    for (const qty of this.quantityByLocation.values()) total += qty;
    return total;
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.quantityByLocation);
  }

  private add(locationId: string, qty: number): void {
    const cur = this.quantityByLocation.get(locationId) ?? 0;
    this.quantityByLocation.set(locationId, cur + qty);
  }

  private deduct(locationId: string, qty: number, productId: string): void {
    const cur = this.quantityByLocation.get(locationId) ?? 0;
    if (cur < qty) {
      throw new InsufficientStockError(productId, locationId, cur, qty);
    }
    this.quantityByLocation.set(locationId, cur - qty);
  }
}
