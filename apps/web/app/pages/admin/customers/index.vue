<template>
  <div>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-white">Customers</h1>
      <button
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        style="background:#f97316"
        @click="showCreate = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Customer
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-4">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search by name, email or phone..."
          class="rounded-lg text-sm border outline-none focus:border-orange-500 pl-9 pr-3 py-2 w-full"
          style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
          @input="debouncedFetch"
        />
      </div>
      <select
        v-model="segment"
        class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2"
        style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5;min-width:160px"
        @change="fetch"
      >
        <option v-for="opt in segmentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Table card -->
    <div class="rounded-xl overflow-hidden" style="background:#1a1a1a;border:1px solid #222">
      <div v-if="pending" class="flex items-center justify-center py-16">
        <svg class="w-6 h-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr style="border-bottom:1px solid #222">
            <th class="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 py-3">Code</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 py-3">Name</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 py-3">Email</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 py-3">Phone</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 py-3">Segment</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 py-3">Balance</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 py-3">Status</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in (data?.items ?? [])"
            :key="(row as any).id"
            class="transition-colors"
            style="border-bottom:1px solid #1e1e1e"
            :style="{ background: 'transparent' }"
            @mouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'"
            @mouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td class="px-4 py-3 text-sm font-mono text-zinc-400">{{ (row as any).code ?? '—' }}</td>
            <td class="px-4 py-3 text-sm font-medium text-white">{{ (row as any).name }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400">{{ (row as any).email ?? '—' }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400">{{ (row as any).phone ?? '—' }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :style="segmentBadgeStyle((row as any).segment)">
                {{ (row as any).segment }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm" :class="(row as any).balance < 0 ? 'text-red-400' : 'text-zinc-200'">
              {{ fmt((row as any).balance) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :style="(row as any).isActive
                  ? 'background:rgba(34,197,94,0.12);color:#22c55e'
                  : 'background:rgba(113,113,122,0.15);color:#71717a'"
              >
                {{ (row as any).isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button
                class="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                @click="startEdit(row as Record<string, unknown>)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-2.828 0L6.586 13.414a2 2 0 010-2.828L9 13zm-6 6h6" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!data?.items?.length">
            <td colspan="8" class="px-4 py-12 text-center text-sm text-zinc-500">No customers found.</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination footer -->
      <div class="flex items-center justify-between px-4 py-3" style="border-top:1px solid #222">
        <span class="text-sm text-zinc-500">{{ data?.total ?? 0 }} customers</span>
        <UPagination v-model="page" :page-count="pageSize" :total="data?.total ?? 0" @update:model-value="fetch" />
      </div>
    </div>

    <!-- Create / Edit modal -->
    <UModal v-model="showCreate">
      <div class="rounded-xl overflow-hidden" style="background:#1a1a1a">
        <!-- Modal header -->
        <div class="flex items-center justify-between px-5 py-4" style="border-bottom:1px solid #222">
          <h2 class="text-base font-semibold text-white">{{ editing ? 'Edit Customer' : 'New Customer' }}</h2>
          <button class="text-zinc-500 hover:text-white transition-colors" @click="closeModal">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal body -->
        <div class="p-5">
          <form class="space-y-4" @submit.prevent="save">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1">Name <span class="text-orange-500">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2 w-full"
                  style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1">Code</label>
                <input
                  v-model="form.code"
                  type="text"
                  placeholder="C-001"
                  class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2 w-full"
                  style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2 w-full"
                  style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
                <input
                  v-model="form.phone"
                  type="text"
                  placeholder="+254..."
                  class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2 w-full"
                  style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1">Segment</label>
                <select
                  v-model="form.segment"
                  class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2 w-full"
                  style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
                >
                  <option v-for="opt in segmentOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1">Credit Limit</label>
                <input
                  v-model.number="form.creditLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2 w-full"
                  style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1">Address</label>
              <textarea
                v-model="form.address"
                rows="2"
                class="rounded-lg text-sm border outline-none focus:border-orange-500 px-3 py-2 w-full resize-none"
                style="background:#1a1a1a;border-color:#2a2a2a;color:#e5e5e5"
              />
            </div>

            <!-- Error -->
            <div v-if="formError" class="rounded-lg px-3 py-2 text-sm text-red-400" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">
              {{ formError }}
            </div>

            <!-- Actions -->
            <div class="flex gap-3 justify-end pt-1">
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity"
                style="background:#f97316"
                :class="saving ? 'opacity-60 cursor-not-allowed' : ''"
                :disabled="saving"
              >
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {{ editing ? 'Save' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
definePageMeta({ layout: 'admin' });

const { api } = useApi();
const search = ref('');
const segment = ref('');
const page = ref(1);
const pageSize = 50;
const showCreate = ref(false);
const saving = ref(false);
const formError = ref('');
const editing = ref<string | null>(null);

const form = reactive({
  name: '',
  code: '',
  email: '',
  phone: '',
  segment: 'retail' as 'retail' | 'wholesale' | 'vip' | 'staff',
  creditLimit: 0,
  address: '',
});

const segmentOptions = [
  { label: 'All segments', value: '' },
  { label: 'Retail', value: 'retail' },
  { label: 'Wholesale', value: 'wholesale' },
  { label: 'VIP', value: 'vip' },
  { label: 'Staff', value: 'staff' },
];

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'segment', label: 'Segment' },
  { key: 'balance', label: 'Balance' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: '' },
];

const { data, pending, refresh } = await useAsyncData('customers', () =>
  api<{ items: unknown[]; total: number }>('/api/v1/customers', {
    query: { limit: pageSize, offset: (page.value - 1) * pageSize, search: search.value || undefined, segment: segment.value || undefined },
  }),
  { watch: [page], server: false },
);

function fetch() { void refresh(); }
const debouncedFetch = useDebounceFn(fetch, 300);

function fmt(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}

function segmentColor(s: string) {
  return { retail: 'blue', wholesale: 'indigo', vip: 'yellow', staff: 'purple' }[s] ?? 'gray';
}

function segmentBadgeStyle(s: string): string {
  const map: Record<string, string> = {
    retail:    'background:rgba(59,130,246,0.12);color:#60a5fa',
    wholesale: 'background:rgba(99,102,241,0.12);color:#818cf8',
    vip:       'background:rgba(245,158,11,0.12);color:#fbbf24',
    staff:     'background:rgba(168,85,247,0.12);color:#c084fc',
  };
  return map[s] ?? 'background:rgba(113,113,122,0.15);color:#71717a';
}

function startEdit(row: Record<string, unknown>) {
  editing.value = row['id'] as string;
  Object.assign(form, {
    name: row['name'],
    code: row['code'] ?? '',
    email: row['email'] ?? '',
    phone: row['phone'] ?? '',
    segment: row['segment'],
    creditLimit: row['creditLimit'],
    address: row['address'] ?? '',
  });
  showCreate.value = true;
}

function closeModal() {
  showCreate.value = false;
  editing.value = null;
  formError.value = '';
  Object.assign(form, { name: '', code: '', email: '', phone: '', segment: 'retail', creditLimit: 0, address: '' });
}

async function save() {
  saving.value = true;
  formError.value = '';
  try {
    const body = {
      name: form.name,
      code: form.code || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      segment: form.segment,
      creditLimit: form.creditLimit,
      address: form.address || undefined,
    };
    if (editing.value) {
      await api(`/api/v1/customers/${editing.value}`, { method: 'PATCH', body });
    } else {
      await api('/api/v1/customers', { method: 'POST', body });
    }
    closeModal();
    void refresh();
  } catch (e: unknown) {
    formError.value = (e as Error).message ?? 'Failed to save';
  } finally {
    saving.value = false;
  }
}
</script>
