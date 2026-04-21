<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Custom Fields</h1>
      <UButton icon="i-heroicons-plus" @click="showCreate = true">Add Field</UButton>
    </div>

    <div class="mb-4">
      <USelect
        v-model="entityType"
        :options="entityTypes"
        value-attribute="value"
        option-attribute="label"
        @change="fetch"
      />
    </div>

    <UCard>
      <UTable :rows="fields" :columns="columns" :loading="pending">
        <template #dataType-data="{ row }">
          <UBadge :label="row.dataType" variant="soft" />
        </template>
        <template #isRequired-data="{ row }">
          <UIcon :name="row.isRequired ? 'i-heroicons-check' : 'i-heroicons-minus'" />
        </template>
        <template #actions-data="{ row }">
          <UButton
            size="xs"
            color="red"
            variant="ghost"
            icon="i-heroicons-trash"
            @click="deleteField(row.id)"
          />
        </template>
      </UTable>
    </UCard>

    <UModal v-model="showCreate">
      <UCard>
        <template #header><h2 class="text-lg font-semibold">Add Custom Field</h2></template>
        <FieldDefinitionForm :entity-type="entityType" @saved="onSaved" @cancel="showCreate = false" />
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { FieldDefinitionResponse } from '@inventory/contracts';

definePageMeta({ layout: 'admin' });

const { api } = useApi();
const showCreate = ref(false);
const entityType = ref('product');

const entityTypes = [
  { label: 'Product', value: 'product' },
  { label: 'Asset', value: 'asset' },
  { label: 'Customer', value: 'customer' },
];

const { data: fields, pending, refresh } = await useAsyncData(
  () => `fields-${entityType.value}`,
  () =>
    api<FieldDefinitionResponse[]>('/api/v1/metadata/fields', {
      query: { entityType: entityType.value },
    }),
  { watch: [entityType], default: () => [] as FieldDefinitionResponse[] },
);

function fetch() { void refresh(); }

async function deleteField(id: string) {
  await api(`/api/v1/metadata/fields/${id}`, { method: 'DELETE' });
  void refresh();
}

function onSaved() {
  showCreate.value = false;
  void refresh();
}

const columns = [
  { key: 'label', label: 'Label' },
  { key: 'fieldKey', label: 'Key' },
  { key: 'dataType', label: 'Type' },
  { key: 'isRequired', label: 'Required' },
  { key: 'section', label: 'Section' },
  { key: 'displayOrder', label: 'Order' },
  { key: 'actions', label: '' },
];
</script>
