<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Customers</h1>
      <UButton icon="i-heroicons-plus" @click="showCreate = true">Add Customer</UButton>
    </div>

    <div class="flex gap-3 mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search by name, email or phone..."
        class="flex-1"
        @input="debouncedFetch"
      />
      <USelect
        v-model="segment"
        :options="segmentOptions"
        value-attribute="value"
        option-attribute="label"
        @change="fetch"
      />
    </div>

    <UCard>
      <UTable :rows="data?.items ?? []" :columns="columns" :loading="pending">
        <template #segment-data="{ row }">
          <UBadge :color="segmentColor(row.segment)" :label="row.segment" />
        </template>
        <template #balance-data="{ row }">
          <span :class="row.balance < 0 ? 'text-red-500' : ''">{{ fmt(row.balance) }}</span>
        </template>
        <template #isActive-data="{ row }">
          <UBadge :color="row.isActive ? 'green' : 'gray'" :label="row.isActive ? 'Active' : 'Inactive'" />
        </template>
        <template #actions-data="{ row }">
          <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" @click="startEdit(row)" />
        </template>
      </UTable>
      <div class="flex items-center justify-between p-4 border-t">
        <span class="text-sm text-gray-500">{{ data?.total ?? 0 }} customers</span>
        <UPagination v-model="page" :page-count="pageSize" :total="data?.total ?? 0" @update:model-value="fetch" />
      </div>
    </UCard>

    <!-- Create / Edit modal -->
    <UModal v-model="showCreate">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">{{ editing ? 'Edit Customer' : 'New Customer' }}</h2>
        </template>
        <form class="space-y-4" @submit.prevent="save">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Name" required>
              <UInput v-model="form.name" />
            </UFormGroup>
            <UFormGroup label="Code">
              <UInput v-model="form.code" placeholder="C-001" />
            </UFormGroup>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Email">
              <UInput v-model="form.email" type="email" />
            </UFormGroup>
            <UFormGroup label="Phone">
              <UInput v-model="form.phone" placeholder="+254..." />
            </UFormGroup>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Segment">
              <USelect v-model="form.segment" :options="segmentOptions.slice(1)" value-attribute="value" option-attribute="label" />
            </UFormGroup>
            <UFormGroup label="Credit Limit">
              <UInput v-model.number="form.creditLimit" type="number" min="0" step="0.01" />
            </UFormGroup>
          </div>
          <UFormGroup label="Address">
            <UTextarea v-model="form.address" :rows="2" />
          </UFormGroup>
          <UAlert v-if="formError" color="red" :description="formError" />
          <div class="flex gap-3 justify-end">
            <UButton type="button" variant="ghost" @click="closeModal">Cancel</UButton>
            <UButton type="submit" :loading="saving">{{ editing ? 'Save' : 'Create' }}</UButton>
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
  { watch: [page] },
);

function fetch() { void refresh(); }
const debouncedFetch = useDebounceFn(fetch, 300);

function fmt(val: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
}

function segmentColor(s: string) {
  return { retail: 'blue', wholesale: 'indigo', vip: 'yellow', staff: 'purple' }[s] ?? 'gray';
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
