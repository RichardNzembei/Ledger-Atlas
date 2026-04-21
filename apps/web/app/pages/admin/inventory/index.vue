<template>
  <div style="color:#fff">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <div>
        <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Stock Levels</h1>
        <p style="font-size:0.8rem;color:#71717a;margin:0.25rem 0 0">Live on-hand quantities across all locations</p>
      </div>
      <div style="display:flex;gap:0.5rem">
        <button
          type="button"
          style="background:#222;color:#999;border:1px solid #333;border-radius:0.5rem;padding:0.4rem 0.85rem;font-size:0.8rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.4rem"
          @click="showReceive = true"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
          Receive Stock
        </button>
        <button
          type="button"
          style="background:#222;color:#999;border:1px solid #333;border-radius:0.5rem;padding:0.4rem 0.85rem;font-size:0.8rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.4rem"
          @click="showTransfer = true"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/></svg>
          Transfer
        </button>
        <button
          type="button"
          style="background:#222;color:#999;border:1px solid #333;border-radius:0.5rem;padding:0.4rem 0.85rem;font-size:0.8rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.4rem"
          @click="showAdjust = true"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/></svg>
          Adjust
        </button>
      </div>
    </div>

    <!-- Filter bar -->
    <div style="display:flex;gap:0.75rem;margin-bottom:1rem">
      <select
        v-model="locationFilter"
        style="background:#1a1a1a;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.4rem 0.75rem;font-size:0.8rem;outline:none;min-width:180px"
        @change="fetch"
      >
        <option value="">All locations</option>
        <option v-for="opt in allLocationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Table card -->
    <div style="background:#1a1a1a;border:1px solid #222;border-radius:0.75rem;overflow:hidden">
      <!-- Loading state -->
      <div v-if="pending" style="padding:3rem;text-align:center;color:#71717a;font-size:0.875rem">
        Loading stock levels…
      </div>

      <table v-else style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid #1e1e1e">
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Product</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Location</th>
            <th style="text-align:right;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Quantity</th>
            <th style="text-align:right;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Reserved</th>
            <th style="text-align:right;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Available</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in stockLevels"
            :key="row.id ?? row.productId"
            style="border-bottom:1px solid #1e1e1e;transition:background 0.1s"
            @mouseenter="(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'"
            @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
          >
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#e5e5e5">
              {{ productName(row.productId) }}
            </td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#e5e5e5">
              {{ locationName(row.locationId) }}
            </td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;text-align:right">
              <span :style="row.quantity <= 10 ? 'color:#ef4444;font-weight:600' : 'color:#e5e5e5'">
                {{ row.quantity }}
              </span>
            </td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#71717a;text-align:right">{{ row.reserved }}</td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#e5e5e5;text-align:right">{{ row.available }}</td>
            <td style="padding:0.75rem 1rem;font-size:0.75rem;color:#71717a">
              {{ row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—' }}
            </td>
          </tr>
          <tr v-if="!stockLevels?.length">
            <td colspan="6" style="padding:3rem;text-align:center;color:#71717a;font-size:0.875rem">No stock records found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Receive Stock Modal -->
    <UModal v-model="showReceive">
      <div style="background:#1a1a1a;border-radius:0.75rem;overflow:hidden;width:100%;max-width:480px">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:1rem;font-weight:600;color:#fff;margin:0">Receive Stock</h2>
          <button type="button" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:1.25rem;line-height:1;padding:0" @click="showReceive = false">&#x2715;</button>
        </div>
        <form style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem" @submit.prevent="receiveStock">
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Product <span style="color:#f97316">*</span></label>
            <select
              v-model="receiveForm.productId"
              required
              style="width:100%;background:#1a1a1a;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
            >
              <option value="">Select product…</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Location <span style="color:#f97316">*</span></label>
            <select
              v-model="receiveForm.locationId"
              required
              style="width:100%;background:#1a1a1a;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
            >
              <option value="">Select location…</option>
              <option v-for="opt in allLocationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Quantity <span style="color:#f97316">*</span></label>
            <input
              v-model.number="receiveForm.quantity"
              type="number"
              min="1"
              required
              placeholder="0"
              style="width:100%;background:#1a1a1a;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
            />
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Reference / PO Number</label>
            <input
              v-model="receiveForm.notes"
              type="text"
              placeholder="e.g. PO-2024-001"
              style="width:100%;background:#1a1a1a;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
            />
          </div>
          <div v-if="receiveError" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.8rem;color:#ef4444">
            {{ receiveError }}
          </div>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:0.5rem">
            <button
              type="button"
              style="background:#222;color:#999;border:1px solid #333;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer"
              @click="showReceive = false"
            >Cancel</button>
            <button
              type="submit"
              :disabled="receiveSaving"
              style="background:#f97316;color:#fff;border:none;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer"
            >
              {{ receiveSaving ? 'Receiving…' : 'Receive Stock' }}
            </button>
          </div>
        </form>
      </div>
    </UModal>

    <!-- Transfer Modal (stub) -->
    <UModal v-model="showTransfer">
      <div style="background:#1a1a1a;border-radius:0.75rem;overflow:hidden;max-width:400px">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:1rem;font-weight:600;color:#fff;margin:0">Transfer Stock</h2>
          <button type="button" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:1.25rem;line-height:1;padding:0" @click="showTransfer = false">&#x2715;</button>
        </div>
        <div style="padding:1.5rem">
          <p style="font-size:0.875rem;color:#71717a;margin:0">Transfer form — coming soon.</p>
        </div>
      </div>
    </UModal>

    <!-- Adjust Modal (stub) -->
    <UModal v-model="showAdjust">
      <div style="background:#1a1a1a;border-radius:0.75rem;overflow:hidden;max-width:400px">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:1rem;font-weight:600;color:#fff;margin:0">Adjust Stock</h2>
          <button type="button" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:1.25rem;line-height:1;padding:0" @click="showAdjust = false">&#x2715;</button>
        </div>
        <div style="padding:1.5rem">
          <p style="font-size:0.875rem;color:#71717a;margin:0">Adjustment form — coming soon.</p>
        </div>
      </div>
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
const receiveSaving = ref(false);
const receiveError = ref('');

const receiveForm = reactive({
  productId: '',
  locationId: '',
  quantity: 1,
  notes: '',
});

const { data: stockLevels, pending, refresh } = await useAsyncData(
  'stock-levels',
  () =>
    api<StockOnHandResponse[]>('/api/v1/inventory/stock', {
      query: { locationId: locationFilter.value || undefined, limit: 200 },
    }),
  { server: false, default: () => [] as StockOnHandResponse[] },
);

const { data: productsData } = await useAsyncData('inv-products', () =>
  api<{ items: Array<{ id: string; name: string }> }>('/api/v1/products', { query: { limit: 100 } }),
  { server: false, default: () => ({ items: [] as Array<{ id: string; name: string }> }) },
);

const { data: locationsData } = await useAsyncData('inv-locations', () =>
  api<Array<{ id: string; name: string; code: string }>>('/api/v1/locations', { query: { limit: 200 } }),
  { server: false, default: () => [] as Array<{ id: string; name: string; code: string }> },
);

const products = computed(() => productsData.value?.items ?? []);
const allLocationOptions = computed(
  () => (locationsData.value ?? []).map((l) => ({ label: `${l.code} — ${l.name}`, value: l.id })),
);

function productName(id: string) {
  return products.value.find((p) => p.id === id)?.name ?? id;
}
function locationName(id: string) {
  return (locationsData.value ?? []).find((l) => l.id === id)?.name ?? id;
}

function fetch() { void refresh(); }

async function receiveStock() {
  receiveSaving.value = true;
  receiveError.value = '';
  try {
    await api('/api/v1/inventory/receive', {
      method: 'POST',
      body: {
        locationId: receiveForm.locationId,
        items: [{ productId: receiveForm.productId, quantity: receiveForm.quantity }],
        notes: receiveForm.notes || undefined,
      },
    });
    showReceive.value = false;
    Object.assign(receiveForm, { productId: '', locationId: '', quantity: 1, notes: '' });
    void refresh();
  } catch (e: unknown) {
    receiveError.value = (e as Error).message ?? 'Failed to receive stock';
  } finally {
    receiveSaving.value = false;
  }
}

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
