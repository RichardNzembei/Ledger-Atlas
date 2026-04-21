<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Products</h1>
      <UButton icon="i-heroicons-plus" @click="showCreate = true">Add Product</UButton>
    </div>

    <!-- Search & filters -->
    <div class="flex gap-3 mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search by name or SKU..."
        class="flex-1"
        @input="debouncedFetch"
      />
      <USelect
        v-model="categoryFilter"
        :options="[{ label: 'All categories', value: '' }, ...categories]"
        value-attribute="value"
        option-attribute="label"
        @change="fetch"
      />
    </div>

    <!-- Table -->
    <UCard>
      <UTable
        :rows="data?.items ?? []"
        :columns="columns"
        :loading="pending"
      >
        <template #basePrice-data="{ row }">
          {{ formatCurrency(row.basePrice) }}
        </template>
        <template #isActive-data="{ row }">
          <UBadge :color="row.isActive ? 'green' : 'gray'" :label="row.isActive ? 'Active' : 'Inactive'" />
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" :to="`/admin/products/${row.id}`" />
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between p-4 border-t">
        <span class="text-sm text-gray-500">{{ data?.total ?? 0 }} products</span>
        <UPagination
          v-model="page"
          :page-count="pageSize"
          :total="data?.total ?? 0"
          @update:model-value="fetch"
        />
      </div>
    </UCard>

    <!-- Create modal -->
    <UModal v-model="showCreate">
      <UCard>
        <template #header><h2 class="text-lg font-semibold">New Product</h2></template>
        <ProductCreateForm @saved="onSaved" @cancel="showCreate = false" />
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import type { PaginatedProducts } from '@inventory/contracts';

definePageMeta({ layout: 'admin' });

const { api } = useApi();
const search = ref('');
const categoryFilter = ref('');
const page = ref(1);
const pageSize = 50;
const showCreate = ref(false);

const { data, pending, refresh } = await useAsyncData(
  'products',
  () =>
    api<PaginatedProducts>('/api/v1/products', {
      query: {
        limit: pageSize,
        offset: (page.value - 1) * pageSize,
        search: search.value || undefined,
        category: categoryFilter.value || undefined,
      },
    }),
  { watch: [page] },
);

function fetch() { void refresh(); }
const debouncedFetch = useDebounceFn(fetch, 300);

function onSaved() {
  showCreate.value = false;
  void refresh();
}

const categories = computed(() => {
  const cats = new Set(data.value?.items.map((p) => p.category).filter(Boolean));
  return [...cats].map((c) => ({ label: c!, value: c! }));
});

const columns = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'basePrice', label: 'Price' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: '' },
];

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}
</script>
