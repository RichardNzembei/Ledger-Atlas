<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Settings</h1>
      <UButton icon="i-heroicons-plus" @click="startCreate">Add Setting</UButton>
    </div>

    <div class="flex gap-3 mb-4">
      <USelect
        v-model="scopeType"
        :options="scopeTypeOptions"
        value-attribute="value"
        option-attribute="label"
        @change="fetch"
      />
    </div>

    <UCard>
      <UTable :rows="data ?? []" :columns="columns" :loading="pending">
        <template #scopeType-data="{ row }">
          <UBadge :label="row.scopeType" color="blue" />
        </template>
        <template #value-data="{ row }">
          <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {{ JSON.stringify(row.value).slice(0, 60) }}
          </code>
        </template>
        <template #actions-data="{ row }">
          <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" @click="startEdit(row)" />
        </template>
      </UTable>
    </UCard>

    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">{{ editing ? 'Edit Setting' : 'New Setting' }}</h2>
        </template>
        <form class="space-y-4" @submit.prevent="save">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Scope" required>
              <USelect v-model="form.scopeType" :options="scopeTypeOptions.slice(1)" value-attribute="value" option-attribute="label" />
            </UFormGroup>
            <UFormGroup label="Scope ID" :hint="form.scopeType === 'tenant' ? 'Leave blank for tenant-wide' : 'Required for location/user scope'">
              <UInput v-model="form.scopeId" placeholder="UUID (optional for tenant scope)" />
            </UFormGroup>
          </div>
          <UFormGroup label="Key" required>
            <UInput v-model="form.key" placeholder="feature.dark_mode" />
          </UFormGroup>
          <UFormGroup label="Value (JSON)" required>
            <UTextarea v-model="form.valueRaw" :rows="3" placeholder='true, "string", 42, {"key": "value"}' />
          </UFormGroup>
          <UAlert v-if="formError" color="red" :description="formError" />
          <div class="flex gap-3 justify-end">
            <UButton type="button" variant="ghost" @click="closeModal">Cancel</UButton>
            <UButton type="submit" :loading="saving">{{ editing ? 'Update' : 'Create' }}</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' });

const { api } = useApi();
const scopeType = ref('');
const showModal = ref(false);
const saving = ref(false);
const formError = ref('');
const editing = ref<string | null>(null);

const form = reactive({
  scopeType: 'tenant' as 'tenant' | 'location' | 'user',
  scopeId: '',
  key: '',
  valueRaw: '',
});

const scopeTypeOptions = [
  { label: 'All scopes', value: '' },
  { label: 'Tenant', value: 'tenant' },
  { label: 'Location', value: 'location' },
  { label: 'User', value: 'user' },
];

const columns = [
  { key: 'key', label: 'Key' },
  { key: 'scopeType', label: 'Scope' },
  { key: 'scopeId', label: 'Scope ID' },
  { key: 'value', label: 'Value' },
  { key: 'actions', label: '' },
];

const { data, pending, refresh } = await useAsyncData('settings', () =>
  api<unknown[]>('/api/v1/settings', {
    query: { scopeType: scopeType.value || undefined },
  }),
);

function fetch() { void refresh(); }

function startCreate() {
  editing.value = null;
  Object.assign(form, { scopeType: 'tenant', scopeId: '', key: '', valueRaw: '' });
  showModal.value = true;
}

function startEdit(row: Record<string, unknown>) {
  editing.value = row['id'] as string;
  Object.assign(form, {
    scopeType: row['scopeType'],
    scopeId: row['scopeId'] ?? '',
    key: row['key'],
    valueRaw: JSON.stringify(row['value'], null, 2),
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
  let value: unknown;
  try {
    value = JSON.parse(form.valueRaw);
  } catch {
    formError.value = 'Value must be valid JSON';
    saving.value = false;
    return;
  }
  try {
    const body = {
      scopeType: form.scopeType,
      scopeId: form.scopeId || undefined,
      key: form.key,
      value,
    };
    // Settings use key+scope as natural key — PUT upserts both create and update
    await api('/api/v1/settings', { method: editing.value ? 'PUT' : 'POST', body });
    closeModal();
    void refresh();
  } catch (e: unknown) {
    formError.value = (e as Error).message ?? 'Failed to save';
  } finally {
    saving.value = false;
  }
}
</script>
