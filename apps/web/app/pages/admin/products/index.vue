<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-white">Products</h1>
        <p class="text-xs text-zinc-500 mt-0.5">Manage your product catalogue</p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
        style="background:#f97316;color:#fff"
        @click="showCreate = true"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
        Add Product
      </button>
    </div>

    <!-- Search & filters -->
    <div class="flex gap-2 mb-4">
      <div class="flex-1 relative">
        <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or SKU…"
          class="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-transparent border outline-none transition-colors focus:border-orange-500"
          style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
          @input="debouncedFetch"
        />
      </div>
      <select
        v-model="categoryFilter"
        class="px-3 py-2 rounded-lg text-sm border outline-none transition-colors focus:border-orange-500"
        style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
        @change="fetch"
      >
        <option value="">All categories</option>
        <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <!-- Table card -->
    <div class="rounded-xl overflow-hidden" style="background:#1a1a1a;border:1px solid #222">
      <table class="w-full">
        <thead>
          <tr style="border-bottom:1px solid #222">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">SKU</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Price</th>
            <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
            <th class="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending">
            <td colspan="6" class="px-4 py-12 text-center text-zinc-600 text-sm">Loading…</td>
          </tr>
          <tr v-else-if="!data?.items?.length">
            <td colspan="6" class="px-4 py-16 text-center">
              <div class="flex flex-col items-center gap-2">
                <UIcon name="i-heroicons-cube" class="w-8 h-8 text-zinc-700" />
                <span class="text-sm text-zinc-600">No products yet. Add your first one.</span>
              </div>
            </td>
          </tr>
          <tr
            v-for="row in data?.items"
            :key="row.id"
            class="transition-colors hover:bg-white/[0.02]"
            style="border-bottom:1px solid #1e1e1e"
          >
            <td class="px-4 py-3 text-xs font-mono text-zinc-400">{{ row.sku }}</td>
            <td class="px-4 py-3 text-sm font-medium text-white">{{ row.name }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400">{{ row.category || '—' }}</td>
            <td class="px-4 py-3 text-sm text-right text-white">{{ fmt(row.basePrice) }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                :style="row.isActive ? 'background:rgba(34,197,94,0.12);color:#22c55e' : 'background:rgba(113,113,122,0.15);color:#71717a'"
              >{{ row.isActive ? 'Active' : 'Inactive' }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-zinc-500 hover:text-white"
                @click="editRow(row)"
              >
                <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between px-4 py-3" style="border-top:1px solid #222">
        <span class="text-xs text-zinc-600">{{ data?.total ?? 0 }} products</span>
        <div class="flex gap-1">
          <button
            class="px-2 py-1 rounded text-xs transition-colors disabled:opacity-30"
            style="background:#222;color:#999"
            :disabled="page === 1"
            @click="page--; fetch()"
          >← Prev</button>
          <button
            class="px-2 py-1 rounded text-xs transition-colors disabled:opacity-30"
            style="background:#222;color:#999"
            :disabled="!data || page * pageSize >= (data.total ?? 0)"
            @click="page++; fetch()"
          >Next →</button>
        </div>
      </div>
    </div>

    <!-- Create / Edit modal -->
    <UModal v-model="showCreate">
      <div class="rounded-xl overflow-hidden" style="background:#1a1a1a">
        <div class="flex items-center justify-between px-5 py-4" style="border-bottom:1px solid #222">
          <h2 class="text-base font-semibold text-white">{{ editingProduct ? 'Edit Product' : 'New Product' }}</h2>
          <button class="text-zinc-500 hover:text-white transition-colors" @click="closeModal">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
        <div class="p-5">
          <ProductCreateForm :initial="editingProduct ?? undefined" @saved="onSaved" @cancel="closeModal" />
        </div>
      </div>
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
const editingProduct = ref<Record<string, unknown> | null>(null);

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
  { watch: [page], server: false },
);

function fetch() { void refresh(); }
const debouncedFetch = useDebounceFn(fetch, 300);

function onSaved() {
  closeModal();
  void refresh();
}

function closeModal() {
  showCreate.value = false;
  editingProduct.value = null;
}

function editRow(row: unknown) {
  editingProduct.value = row as Record<string, unknown>;
  showCreate.value = true;
}

const categories = computed(() => {
  const cats = new Set(data.value?.items.map((p) => p.category).filter(Boolean));
  return [...cats].map((c) => ({ label: c!, value: c! }));
});

function fmt(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}
</script>
