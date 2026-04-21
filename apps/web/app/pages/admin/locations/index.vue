<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Locations</h1>
      <UButton icon="i-heroicons-plus" @click="startCreate">Add Location</UButton>
    </div>

    <UCard>
      <UTable :rows="data?.items ?? []" :columns="columns" :loading="pending">
        <template #type-data="{ row }">
          <UBadge :color="typeColor(row.type)" :label="row.type" />
        </template>
        <template #isActive-data="{ row }">
          <UBadge :color="row.isActive ? 'green' : 'gray'" :label="row.isActive ? 'Active' : 'Inactive'" />
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" @click="startEdit(row)" />
            <UButton
              v-if="row.isActive"
              size="xs"
              variant="ghost"
              color="red"
              icon="i-heroicons-archive-box-x-mark"
              @click="deactivate(row.id)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">{{ editing ? 'Edit Location' : 'New Location' }}</h2>
        </template>
        <form class="space-y-4" @submit.prevent="save">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Code" required>
              <UInput v-model="form.code" placeholder="WH-001" />
            </UFormGroup>
            <UFormGroup label="Name" required>
              <UInput v-model="form.name" placeholder="Main Warehouse" />
            </UFormGroup>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Type" required>
              <USelect v-model="form.type" :options="typeOptions" value-attribute="value" option-attribute="label" />
            </UFormGroup>
            <UFormGroup label="Parent Location">
              <USelect
                v-model="form.parentId"
                :options="[{ label: 'None', value: '' }, ...locationOptions]"
                value-attribute="value"
                option-attribute="label"
              />
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
definePageMeta({ layout: 'admin' });

const { api } = useApi();
const showModal = ref(false);
const saving = ref(false);
const formError = ref('');
const editing = ref<string | null>(null);

const form = reactive({
  code: '',
  name: '',
  type: 'store' as 'warehouse' | 'store' | 'bin' | 'virtual',
  parentId: '',
  address: '',
});

const typeOptions = [
  { label: 'Warehouse', value: 'warehouse' },
  { label: 'Store', value: 'store' },
  { label: 'Bin', value: 'bin' },
  { label: 'Virtual', value: 'virtual' },
];

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'address', label: 'Address' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: '' },
];

const { data, pending, refresh } = await useAsyncData('locations', () =>
  api<{ items: Array<{ id: string; name: string; code: string; type: string; isActive: boolean; address?: string }> }>('/api/v1/locations', {
    query: { limit: 200 },
  }),
);

const locationOptions = computed(
  () => data.value?.items.filter((l) => l.isActive).map((l) => ({ label: `${l.code} — ${l.name}`, value: l.id })) ?? [],
);

function typeColor(t: string) {
  return { warehouse: 'blue', store: 'green', bin: 'gray', virtual: 'purple' }[t] ?? 'gray';
}

function startCreate() {
  editing.value = null;
  Object.assign(form, { code: '', name: '', type: 'store', parentId: '', address: '' });
  showModal.value = true;
}

function startEdit(row: Record<string, unknown>) {
  editing.value = row['id'] as string;
  Object.assign(form, {
    code: row['code'],
    name: row['name'],
    type: row['type'],
    parentId: row['parentId'] ?? '',
    address: row['address'] ?? '',
  });
  showModal.value = true;
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
      code: form.code,
      name: form.name,
      type: form.type,
      parentId: form.parentId || undefined,
      address: form.address || undefined,
    };
    if (editing.value) {
      await api(`/api/v1/locations/${editing.value}`, { method: 'PATCH', body });
    } else {
      await api('/api/v1/locations', { method: 'POST', body });
    }
    closeModal();
    void refresh();
  } catch (e: unknown) {
    formError.value = (e as Error).message ?? 'Failed to save';
  } finally {
    saving.value = false;
  }
}

async function deactivate(id: string) {
  try {
    await api(`/api/v1/locations/${id}`, { method: 'DELETE' });
    void refresh();
  } catch (e: unknown) {
    // toast would go here in production
    console.error(e);
  }
}
</script>
