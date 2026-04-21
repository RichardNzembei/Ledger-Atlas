<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Assets</h1>
      <UButton icon="i-heroicons-plus" @click="startCreate">Add Asset</UButton>
    </div>

    <div class="flex gap-3 mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search by name or tag..."
        class="flex-1"
        @input="debouncedFetch"
      />
      <USelect
        v-model="statusFilter"
        :options="statusOptions"
        value-attribute="value"
        option-attribute="label"
        @change="fetch"
      />
    </div>

    <UCard>
      <UTable :rows="data?.items ?? []" :columns="columns" :loading="pending">
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" :label="row.status" />
        </template>
        <template #lifecycleStage-data="{ row }">
          <span class="text-xs text-gray-500">{{ row.lifecycleStage }}</span>
        </template>
        <template #acquisitionCost-data="{ row }">
          {{ fmt(row.acquisitionCost) }}
        </template>
        <template #bookValue-data="{ row }">
          {{ fmt(row.bookValue) }}
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" @click="startEdit(row)" />
            <UButton size="xs" variant="ghost" icon="i-heroicons-user-plus" @click="startAssign(row)" />
          </div>
        </template>
      </UTable>
      <div class="flex items-center justify-between p-4 border-t">
        <span class="text-sm text-gray-500">{{ data?.total ?? 0 }} assets</span>
        <UPagination v-model="page" :page-count="pageSize" :total="data?.total ?? 0" @update:model-value="fetch" />
      </div>
    </UCard>

    <!-- Create/Edit modal -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">{{ editing ? 'Edit Asset' : 'New Asset' }}</h2>
        </template>
        <form class="space-y-4" @submit.prevent="save">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Asset Tag" required>
              <UInput v-model="form.assetTag" placeholder="AST-001" />
            </UFormGroup>
            <UFormGroup label="Name" required>
              <UInput v-model="form.name" />
            </UFormGroup>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Category">
              <UInput v-model="form.category" placeholder="IT Equipment" />
            </UFormGroup>
            <UFormGroup label="Serial Number">
              <UInput v-model="form.serialNumber" />
            </UFormGroup>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Acquisition Cost">
              <UInput v-model.number="form.acquisitionCost" type="number" min="0" step="0.01" />
            </UFormGroup>
            <UFormGroup label="Acquired On">
              <UInput v-model="form.acquiredAt" type="date" />
            </UFormGroup>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Depreciation Method">
              <USelect v-model="form.depreciationMethod" :options="deprOptions" value-attribute="value" option-attribute="label" />
            </UFormGroup>
            <UFormGroup label="Useful Life (months)">
              <UInput v-model.number="form.usefulLifeMonths" type="number" min="1" />
            </UFormGroup>
          </div>
          <UFormGroup label="Notes">
            <UTextarea v-model="form.notes" :rows="2" />
          </UFormGroup>
          <UAlert v-if="formError" color="red" :description="formError" />
          <div class="flex gap-3 justify-end">
            <UButton type="button" variant="ghost" @click="closeModal">Cancel</UButton>
            <UButton type="submit" :loading="saving">{{ editing ? 'Save' : 'Create' }}</UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <!-- Assign modal -->
    <UModal v-model="showAssign">
      <UCard>
        <template #header><h2 class="text-lg font-semibold">Assign Asset</h2></template>
        <form class="space-y-4" @submit.prevent="assign">
          <UFormGroup label="User ID" required>
            <UInput v-model="assignForm.userId" placeholder="UUID of user to assign to" />
          </UFormGroup>
          <UFormGroup label="Location">
            <USelect
              v-model="assignForm.locationId"
              :options="[{ label: 'Unchanged', value: '' }, ...locationOptions]"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>
          <UAlert v-if="formError" color="red" :description="formError" />
          <div class="flex gap-3 justify-end">
            <UButton type="button" variant="ghost" @click="showAssign = false">Cancel</UButton>
            <UButton type="submit" :loading="saving">Assign</UButton>
          </div>
        </form>
      </UCard>
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
  { watch: [page] },
);

const { data: locationsData } = await useAsyncData('asset-locations', () =>
  api<{ items: Array<{ id: string; name: string; code: string }> }>('/api/v1/locations', { query: { limit: 200 } }),
);

const locationOptions = computed(
  () => locationsData.value?.items.map((l) => ({ label: `${l.code} — ${l.name}`, value: l.id })) ?? [],
);

function fetch() { void refresh(); }
const debouncedFetch = useDebounceFn(fetch, 300);
function fmt(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}
function statusColor(s: string) {
  return { active: 'green', in_maintenance: 'yellow', disposed: 'gray', lost: 'red' }[s] ?? 'gray';
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
