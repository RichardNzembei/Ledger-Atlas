<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Stock Levels</h1>
      <div class="flex gap-2">
        <UButton variant="outline" icon="i-heroicons-arrow-down-tray" @click="showReceive = true">
          Receive Stock
        </UButton>
        <UButton variant="outline" icon="i-heroicons-arrows-right-left" @click="showTransfer = true">
          Transfer
        </UButton>
        <UButton variant="outline" icon="i-heroicons-clipboard-document-check" @click="showAdjust = true">
          Adjust
        </UButton>
      </div>
    </div>

    <div class="flex gap-3 mb-4">
      <USelect
        v-model="locationFilter"
        :options="locationOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="All locations"
        @change="fetch"
      />
    </div>

    <UCard>
      <UTable :rows="stockLevels" :columns="columns" :loading="pending">
        <template #quantity-data="{ row }">
          <span :class="row.quantity <= 10 ? 'text-red-600 font-semibold' : ''">
            {{ row.quantity }}
          </span>
        </template>
        <template #available-data="{ row }">
          {{ row.available }}
        </template>
      </UTable>
    </UCard>

    <!-- Modals placeholder — would import ReceiveStockForm, TransferForm, etc. -->
    <UModal v-model="showReceive">
      <UCard>
        <template #header><h2 class="text-lg font-semibold">Receive Stock</h2></template>
        <p class="text-gray-500 text-sm">Receive stock form — Phase 1 implementation</p>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { StockOnHandResponse } from '@inventory/contracts';

definePageMeta({ layout: 'admin' });

const { api } = useApi();
const locationFilter = ref('');
const showReceive = ref(false);
const showTransfer = ref(false);
const showAdjust = ref(false);

const { data: stockLevels, pending, refresh } = await useAsyncData(
  'stock-levels',
  () =>
    api<StockOnHandResponse[]>('/api/v1/inventory/stock', {
      query: { locationId: locationFilter.value || undefined, limit: 200 },
    }),
  { default: () => [] as StockOnHandResponse[] },
);

function fetch() { void refresh(); }

const locationOptions = [{ label: 'All locations', value: '' }];

const columns = [
  { key: 'productId', label: 'Product ID' },
  { key: 'locationId', label: 'Location' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'available', label: 'Available' },
  { key: 'updatedAt', label: 'Updated' },
];
</script>
