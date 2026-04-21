import { defineStore } from 'pinia';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
}

export const usePosCartStore = defineStore('pos-cart', {
  state: () => ({
    locationId: null as string | null,
    customerId: null as string | null,
    items: [] as CartItem[],
  }),

  getters: {
    subtotal: (state) =>
      state.items.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 - i.discountPct / 100), 0),

    taxTotal: (state): number =>
      state.items.reduce(
        (sum, i) =>
          sum + i.quantity * i.unitPrice * (1 - i.discountPct / 100) * (i.taxPct / 100),
        0,
      ),

    total(): number {
      return this.subtotal + this.taxTotal;
    },

    itemCount: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
  },

  actions: {
    addItem(product: Omit<CartItem, 'quantity'>) {
      const existing = this.items.find((i) => i.productId === product.productId);
      if (existing) {
        existing.quantity++;
      } else {
        this.items.push({ ...product, quantity: 1 });
      }
    },

    removeItem(productId: string) {
      this.items = this.items.filter((i) => i.productId !== productId);
    },

    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find((i) => i.productId === productId);
      if (!item) return;
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
      }
    },

    setDiscount(productId: string, pct: number) {
      const item = this.items.find((i) => i.productId === productId);
      if (item) item.discountPct = pct;
    },

    clear() {
      this.items = [];
      this.customerId = null;
    },
  },
});
