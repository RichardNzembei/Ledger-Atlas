<template>
  <div class="h-full overflow-y-auto flex items-start justify-center p-6">
    <div class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
          <UIcon name="i-heroicons-check" class="text-green-600 dark:text-green-400 w-6 h-6" />
        </div>
        <h1 class="text-xl font-bold">Payment Successful</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ sale?.saleNumber }}</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          {{ sale?.completedAt ? formatDate(sale.completedAt) : '' }}
        </p>
      </div>

      <!-- Items -->
      <div class="divide-y divide-gray-100 dark:divide-gray-800 mb-4">
        <div
          v-for="item in sale?.items"
          :key="item.id"
          class="py-2 flex justify-between text-sm"
        >
          <div>
            <span class="font-medium">{{ item.productName }}</span>
            <span class="text-gray-400 ml-2">x{{ item.quantity }}</span>
          </div>
          <span>{{ fmt(item.lineTotal) }}</span>
        </div>
      </div>

      <!-- Totals -->
      <div class="space-y-1 text-sm border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
        <div class="flex justify-between text-gray-500">
          <span>Subtotal</span><span>{{ fmt(sale?.subtotal ?? 0) }}</span>
        </div>
        <div class="flex justify-between text-gray-500">
          <span>Discount</span><span>-{{ fmt(sale?.discountTotal ?? 0) }}</span>
        </div>
        <div class="flex justify-between text-gray-500">
          <span>Tax (16%)</span><span>{{ fmt(sale?.taxTotal ?? 0) }}</span>
        </div>
        <div class="flex justify-between font-bold text-base pt-1">
          <span>Total</span><span>{{ fmt(sale?.total ?? 0) }}</span>
        </div>
        <div class="flex justify-between text-gray-500">
          <span>Paid</span><span>{{ fmt(sale?.paid ?? 0) }}</span>
        </div>
        <div v-if="(sale?.changeGiven ?? 0) > 0" class="flex justify-between text-green-600">
          <span>Change</span><span>{{ fmt(sale?.changeGiven ?? 0) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 space-y-2">
        <UButton block variant="outline" icon="i-heroicons-printer" @click="print">
          Print Receipt
        </UButton>
        <UButton block color="primary" to="/pos">
          New Sale
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'pos' });

const route = useRoute();
const { api } = useApi();

const { data: sale } = await useAsyncData(`sale-${route.params['id']}`, () =>
  api<{
    id: string;
    saleNumber: string;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
    paid: number;
    changeGiven: number;
    completedAt: string | null;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      lineTotal: number;
    }>;
  }>(`/api/v1/sales/${route.params['id']}`),
);

function fmt(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function print() {
  window.print();
}
</script>

<style>
@media print {
  header, .UButton { display: none !important; }
  body { background: white; }
}
</style>
