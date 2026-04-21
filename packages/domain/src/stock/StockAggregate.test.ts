import { describe, it, expect } from 'vitest';
import { StockAggregate } from './StockAggregate.js';
import { InsufficientStockError } from '../errors.js';

const now = '2026-01-01T00:00:00.000Z';
const P1 = 'product-1';
const L1 = 'loc-1';
const L2 = 'loc-2';

describe('StockAggregate', () => {
  it('tracks quantity per location after receipt', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 50, at: now },
    ]);
    expect(agg.quantityAt(L1)).toBe(50);
  });

  it('deducts on sale', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 50, at: now },
      { type: 'StockSold', productId: P1, locationId: L1, quantity: 3, saleId: 's1', saleItemId: 'si1', at: now },
    ]);
    expect(agg.quantityAt(L1)).toBe(47);
  });

  it('handles transfer between locations', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 20, at: now },
      { type: 'StockTransferred', productId: P1, fromLocationId: L1, toLocationId: L2, quantity: 8, at: now },
    ]);
    expect(agg.quantityAt(L1)).toBe(12);
    expect(agg.quantityAt(L2)).toBe(8);
  });

  it('applies stock adjustment', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 10, at: now },
      { type: 'StockAdjusted', productId: P1, locationId: L1, delta: -2, reason: 'damaged', countedQty: 8, systemQty: 10, at: now },
    ]);
    expect(agg.quantityAt(L1)).toBe(8);
  });

  it('adds back on return', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 10, at: now },
      { type: 'StockSold', productId: P1, locationId: L1, quantity: 3, saleId: 's1', saleItemId: 'si1', at: now },
      { type: 'StockReturned', productId: P1, locationId: L1, quantity: 1, saleId: 's1', reason: 'defective', at: now },
    ]);
    expect(agg.quantityAt(L1)).toBe(8);
  });

  it('throws InsufficientStockError on oversell', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 5, at: now },
    ]);
    expect(() =>
      agg.apply({ type: 'StockSold', productId: P1, locationId: L1, quantity: 10, saleId: 's1', saleItemId: 'si1', at: now }),
    ).toThrow(InsufficientStockError);
  });

  it('tracks version correctly', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 10, at: now },
      { type: 'StockSold', productId: P1, locationId: L1, quantity: 3, saleId: 's1', saleItemId: 'si1', at: now },
    ]);
    expect(agg.version).toBe(2);
  });

  it('snapshot returns all locations', () => {
    const agg = StockAggregate.fromHistory([
      { type: 'StockReceived', productId: P1, locationId: L1, quantity: 10, at: now },
      { type: 'StockReceived', productId: P1, locationId: L2, quantity: 5, at: now },
    ]);
    const snap = agg.snapshot();
    expect(snap[L1]).toBe(10);
    expect(snap[L2]).toBe(5);
  });
});
