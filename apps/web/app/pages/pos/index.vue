<template>
  <div class="h-full flex">
    <!-- Product grid -->
    <div class="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900 p-4">
      <!-- Search -->
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search products..."
        class="mb-4"
        @input="debouncedFetch"
      />

      <!-- Products -->
      <div class="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
        <button
          v-for="product in products?.items"
          :key="product.id"
          class="bg-white dark:bg-gray-800 rounded-xl p-4 text-left hover:ring-2 hover:ring-primary-500 transition-all"
          @click="addToCart(product)"
        >
          <p class="font-semibold text-sm truncate">{{ product.name }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ product.sku }}</p>
          <p class="text-primary-600 dark:text-primary-400 font-bold mt-2">
            {{ formatCurrency(product.basePrice) }}
          </p>
        </button>
      </div>
    </div>

    <!-- Cart sidebar -->
    <div class="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col">
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 class="font-semibold">Cart ({{ cart.itemCount }})</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div
          v-for="item in cart.items"
          :key="item.productId"
          class="flex items-center gap-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ item.name }}</p>
            <p class="text-xs text-gray-500">{{ formatCurrency(item.unitPrice) }}</p>
          </div>
          <div class="flex items-center gap-1">
            <UButton
              size="2xs"
              variant="ghost"
              icon="i-heroicons-minus"
              @click="cart.updateQuantity(item.productId, item.quantity - 1)"
            />
            <span class="w-6 text-center text-sm">{{ item.quantity }}</span>
            <UButton
              size="2xs"
              variant="ghost"
              icon="i-heroicons-plus"
              @click="cart.updateQuantity(item.productId, item.quantity + 1)"
            />
          </div>
          <span class="text-sm font-semibold w-16 text-right">
            {{ formatCurrency(item.quantity * item.unitPrice) }}
          </span>
        </div>
      </div>

      <!-- Totals -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <div class="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span><span>{{ formatCurrency(cart.subtotal) }}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-600">
          <span>Tax (16%)</span><span>{{ formatCurrency(cart.taxTotal) }}</span>
        </div>
        <div class="flex justify-between font-bold text-lg">
          <span>Total</span><span>{{ formatCurrency(cart.total) }}</span>
        </div>

        <UButton block color="green" :disabled="cart.itemCount === 0" size="lg" @click="checkout">
          Charge {{ formatCurrency(cart.total) }}
        </UButton>
        <UButton block variant="ghost" :disabled="cart.itemCount === 0" @click="cart.clear">
          Clear Cart
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import type { PaginatedProducts, ProductResponse } from '@inventory/contracts';

definePageMeta({ layout: 'pos' });

const { api } = useApi();
const cart = usePosCartStore();
const search = ref('');

const { data: products, refresh } = await useAsyncData(
  'pos-products',
  () =>
    api<PaginatedProducts>('/api/v1/products', {
      query: { limit: 200, search: search.value || undefined, isActive: true },
    }),
);

const debouncedFetch = useDebounceFn(() => refresh(), 300);

function addToCart(product: ProductResponse) {
  cart.addItem({
    productId: product.id,
    sku: product.sku,
    name: product.name,
    unitPrice: product.basePrice,
    discountPct: 0,
    taxPct: 16,
  });
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}

async function checkout() {
  // Phase 1: create sale then complete with payment
  // For now navigate to payment screen
  await navigateTo('/pos/checkout');
}
</script>
