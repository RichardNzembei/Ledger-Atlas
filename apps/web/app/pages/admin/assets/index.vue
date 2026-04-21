<template>
  <div style="color:#fff">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <div>
        <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Assets</h1>
        <p style="font-size:0.8rem;color:#71717a;margin:0.25rem 0 0">Track, depreciate and assign fixed assets</p>
      </div>
      <button
        type="button"
        style="background:#f97316;color:#fff;border:none;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.4rem"
        @click="startCreate"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
        Add Asset
      </button>
    </div>

    <!-- Search + filter bar -->
    <div style="display:flex;gap:0.75rem;margin-bottom:1rem">
      <div style="flex:1;position:relative">
        <svg style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#71717a;pointer-events:none" width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or tag…"
          style="width:100%;background:#1a1a1a;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem 0.5rem 2.25rem;font-size:0.875rem;outline:none;box-sizing:border-box"
          @input="debouncedFetch"
        />
      </div>
      <select
        v-model="statusFilter"
        style="background:#1a1a1a;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;min-width:160px"
        @change="fetch"
      >
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Table card -->
    <div style="background:#1a1a1a;border:1px solid #222;border-radius:0.75rem;overflow:hidden">
      <div v-if="pending" style="padding:3rem;text-align:center;color:#71717a;font-size:0.875rem">
        Loading assets…
      </div>

      <table v-else style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid #1e1e1e">
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Tag</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Name</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Category</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Status</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Stage</th>
            <th style="text-align:right;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Cost</th>
            <th style="text-align:right;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Book Value</th>
            <th style="padding:0.75rem 1rem;width:80px"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in (data?.items ?? []) as Record<string, unknown>[]"
            :key="(row['id'] as string)"
            style="border-bottom:1px solid #1e1e1e;transition:background 0.1s"
            @mouseenter="(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'"
            @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
          >
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#e5e5e5;font-family:monospace">{{ row['assetTag'] }}</td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#fff;font-weight:500">{{ row['name'] }}</td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#71717a">{{ row['category'] || '—' }}</td>
            <td style="padding:0.75rem 1rem">
              <span :style="statusBadgeStyle(row['status'] as string)" style="display:inline-block;padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:600">
                {{ row['status'] }}
              </span>
            </td>
            <td style="padding:0.75rem 1rem;font-size:0.75rem;color:#71717a">{{ row['lifecycleStage'] || '—' }}</td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#e5e5e5;text-align:right">{{ fmt(row['acquisitionCost'] as number) }}</td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#e5e5e5;text-align:right">{{ fmt(row['bookValue'] as number) }}</td>
            <td style="padding:0.75rem 1rem">
              <div style="display:flex;gap:0.5rem;align-items:center;justify-content:flex-end">
                <button
                  type="button"
                  title="Edit"
                  style="background:none;border:none;color:#71717a;cursor:pointer;padding:0.25rem;border-radius:0.25rem;display:flex;align-items:center"
                  @click="startEdit(row)"
                  @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'"
                  @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = '#71717a'"
                >
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/></svg>
                </button>
                <button
                  type="button"
                  title="Assign"
                  style="background:none;border:none;color:#71717a;cursor:pointer;padding:0.25rem;border-radius:0.25rem;display:flex;align-items:center"
                  @click="startAssign(row)"
                  @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = '#f97316'"
                  @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = '#71717a'"
                >
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!data?.items?.length">
            <td colspan="8" style="padding:3rem;text-align:center;color:#71717a;font-size:0.875rem">No assets found</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination footer -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1rem;border-top:1px solid #1e1e1e">
        <span style="font-size:0.8rem;color:#71717a">{{ data?.total ?? 0 }} assets</span>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <button
            type="button"
            :disabled="page <= 1"
            style="background:#222;color:#999;border:1px solid #333;border-radius:0.375rem;padding:0.3rem 0.7rem;font-size:0.8rem;cursor:pointer;disabled:opacity-50"
            @click="() => { if (page > 1) { page--; fetch(); } }"
          >Prev</button>
          <span style="font-size:0.8rem;color:#71717a;min-width:80px;text-align:center">
            Page {{ page }} of {{ Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)) }}
          </span>
          <button
            type="button"
            :disabled="page >= Math.ceil((data?.total ?? 0) / pageSize)"
            style="background:#222;color:#999;border:1px solid #333;border-radius:0.375rem;padding:0.3rem 0.7rem;font-size:0.8rem;cursor:pointer"
            @click="() => { page++; fetch(); }"
          >Next</button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <UModal v-model="showModal">
      <div style="background:#1a1a1a;border-radius:0.75rem;overflow:hidden;width:100%;max-width:560px">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:1rem;font-weight:600;color:#fff;margin:0">{{ editing ? 'Edit Asset' : 'New Asset' }}</h2>
          <button type="button" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:1.25rem;line-height:1;padding:0" @click="closeModal">&#x2715;</button>
        </div>
        <form style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem" @submit.prevent="save">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Asset Tag <span style="color:#f97316">*</span></label>
              <input
                v-model="form.assetTag"
                type="text"
                placeholder="AST-001"
                required
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Name <span style="color:#f97316">*</span></label>
              <input
                v-model="form.name"
                type="text"
                required
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Category</label>
              <input
                v-model="form.category"
                type="text"
                placeholder="IT Equipment"
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Serial Number</label>
              <input
                v-model="form.serialNumber"
                type="text"
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Acquisition Cost</label>
              <input
                v-model.number="form.acquisitionCost"
                type="number"
                min="0"
                step="0.01"
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Acquired On</label>
              <input
                v-model="form.acquiredAt"
                type="date"
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box;color-scheme:dark"
              />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Depreciation Method</label>
              <select
                v-model="form.depreciationMethod"
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              >
                <option v-for="opt in deprOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Useful Life (months)</label>
              <input
                v-model.number="form.usefulLifeMonths"
                type="number"
                min="1"
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Notes</label>
            <textarea
              v-model="form.notes"
              rows="2"
              style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box;resize:vertical;font-family:inherit"
            />
          </div>
          <div v-if="formError" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.8rem;color:#ef4444">
            {{ formError }}
          </div>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:0.25rem">
            <button
              type="button"
              style="background:#222;color:#999;border:1px solid #333;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer"
              @click="closeModal"
            >Cancel</button>
            <button
              type="submit"
              :disabled="saving"
              style="background:#f97316;color:#fff;border:none;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer"
            >
              {{ saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </UModal>

    <!-- Assign Modal -->
    <UModal v-model="showAssign">
      <div style="background:#1a1a1a;border-radius:0.75rem;overflow:hidden;width:100%;max-width:420px">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:1rem;font-weight:600;color:#fff;margin:0">Assign Asset</h2>
          <button type="button" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:1.25rem;line-height:1;padding:0" @click="showAssign = false">&#x2715;</button>
        </div>
        <form style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem" @submit.prevent="assign">
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">User ID <span style="color:#f97316">*</span></label>
            <input
              v-model="assignForm.userId"
              type="text"
              placeholder="UUID of user to assign to"
              required
              style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
            />
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Location</label>
            <select
              v-model="assignForm.locationId"
              style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
            >
              <option value="">Unchanged</option>
              <option v-for="opt in locationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div v-if="formError" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.8rem;color:#ef4444">
            {{ formError }}
          </div>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:0.25rem">
            <button
              type="button"
              style="background:#222;color:#999;border:1px solid #333;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer"
              @click="showAssign = false"
            >Cancel</button>
            <button
              type="submit"
              :disabled="saving"
              style="background:#f97316;color:#fff;border:none;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer"
            >
              {{ saving ? 'Assigning…' : 'Assign' }}
            </button>
          </div>
        </form>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
definePageMeta({ layout: 'admin' });

const { api } = useApi();
const search = ref('');
const statusFilter = ref('');
const page = ref(1);
const pageSize = 50;
const showModal = ref(false);
const showAssign = ref(false);
const saving = ref(false);
const formError = ref('');
const editing = ref<string | null>(null);
const assigningId = ref<string | null>(null);

const form = reactive({
  assetTag: '', name: '', category: '', serialNumber: '',
  acquisitionCost: 0, acquiredAt: '', usefulLifeMonths: 60,
  depreciationMethod: 'straight_line' as string, notes: '',
});

const assignForm = reactive({ userId: '', locationId: '' });

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'In Maintenance', value: 'in_maintenance' },
  { label: 'Disposed', value: 'disposed' },
  { label: 'Lost', value: 'lost' },
];

const deprOptions = [
  { label: 'Straight Line', value: 'straight_line' },
  { label: 'Declining Balance', value: 'declining_balance' },
  { label: 'Units of Production', value: 'units_of_production' },
  { label: 'None', value: 'none' },
];

const columns = [
  { key: 'assetTag', label: 'Tag' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'lifecycleStage', label: 'Stage' },
  { key: 'acquisitionCost', label: 'Cost' },
  { key: 'bookValue', label: 'Book Value' },
  { key: 'actions', label: '' },
];

const { data, pending, refresh } = await useAsyncData('assets', () =>
  api<{ items: unknown[]; total: number }>('/api/v1/assets', {
    query: {
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      search: search.value || undefined,
      status: statusFilter.value || undefined,
    },
  }),
  { watch: [page], server: false },
);

const { data: locationsData } = await useAsyncData('asset-locations', () =>
  api<Array<{ id: string; name: string; code: string }>>('/api/v1/locations', { query: { limit: 200 } }),
  { server: false, default: () => [] as Array<{ id: string; name: string; code: string }> },
);

const locationOptions = computed(
  () => (locationsData.value ?? []).map((l) => ({ label: `${l.code} — ${l.name}`, value: l.id })),
);

function fetch() { void refresh(); }
const debouncedFetch = useDebounceFn(fetch, 300);

function fmt(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}

function statusColor(s: string) {
  return { active: 'green', in_maintenance: 'yellow', disposed: 'gray', lost: 'red' }[s] ?? 'gray';
}

function statusBadgeStyle(s: string) {
  const map: Record<string, string> = {
    active: 'background:rgba(34,197,94,0.12);color:#4ade80',
    in_maintenance: 'background:rgba(234,179,8,0.12);color:#facc15',
    disposed: 'background:rgba(113,113,122,0.15);color:#a1a1aa',
    lost: 'background:rgba(239,68,68,0.12);color:#f87171',
  };
  return map[s] ?? 'background:rgba(113,113,122,0.15);color:#a1a1aa';
}

function startCreate() {
  editing.value = null;
  Object.assign(form, { assetTag: '', name: '', category: '', serialNumber: '', acquisitionCost: 0, acquiredAt: '', usefulLifeMonths: 60, depreciationMethod: 'straight_line', notes: '' });
  showModal.value = true;
}

function startEdit(row: Record<string, unknown>) {
  editing.value = row['id'] as string;
  Object.assign(form, {
    assetTag: row['assetTag'], name: row['name'], category: row['category'] ?? '',
    serialNumber: row['serialNumber'] ?? '', acquisitionCost: row['acquisitionCost'],
    acquiredAt: row['acquiredAt'] ?? '', usefulLifeMonths: row['usefulLifeMonths'] ?? 60,
    depreciationMethod: row['depreciationMethod'], notes: row['notes'] ?? '',
  });
  showModal.value = true;
}

function startAssign(row: Record<string, unknown>) {
  assigningId.value = row['id'] as string;
  assignForm.userId = '';
  assignForm.locationId = '';
  showAssign.value = true;
}

function closeModal() {
  showModal.value = false;
  formError.value = '';
}

async function save() {
  saving.value = true;
  formError.value = '';
  try {
    const body = {
      assetTag: form.assetTag, name: form.name,
      category: form.category || undefined, serialNumber: form.serialNumber || undefined,
      acquisitionCost: form.acquisitionCost, acquiredAt: form.acquiredAt || undefined,
      usefulLifeMonths: form.usefulLifeMonths,
      depreciationMethod: form.depreciationMethod, notes: form.notes || undefined,
    };
    if (editing.value) {
      await api(`/api/v1/assets/${editing.value}`, { method: 'PATCH', body });
    } else {
      await api('/api/v1/assets', { method: 'POST', body });
    }
    closeModal();
    void refresh();
  } catch (e: unknown) {
    formError.value = (e as Error).message ?? 'Failed to save';
  } finally {
    saving.value = false;
  }
}

async function assign() {
  if (!assigningId.value) return;
  saving.value = true;
  formError.value = '';
  try {
    await api(`/api/v1/assets/${assigningId.value}/assign`, {
      method: 'POST',
      body: {
        userId: assignForm.userId,
        locationId: assignForm.locationId || undefined,
      },
    });
    showAssign.value = false;
    void refresh();
  } catch (e: unknown) {
    formError.value = (e as Error).message ?? 'Failed to assign';
  } finally {
    saving.value = false;
  }
}
</script>
