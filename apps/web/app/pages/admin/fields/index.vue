<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Custom Fields</h1>
      <div style="display:flex;gap:8px">
        <button
          style="background:#1a1a1a;color:#a3a3a3;border:1px solid #2a2a2a;border-radius:8px;padding:8px 14px;font-size:0.875rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px"
          @click="showTemplates = true"
        >
          <UIcon name="i-heroicons-document-duplicate" class="w-4 h-4" />
          Templates
        </button>
        <button
          style="background:#f97316;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:0.875rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px"
          @click="showCreate = true"
        >
          <span style="font-size:1rem;line-height:1">+</span> Add Field
        </button>
      </div>
    </div>

    <!-- Entity type filter -->
    <div style="margin-bottom:16px">
      <select
        v-model="entityType"
        style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;cursor:pointer;appearance:none;min-width:160px"
        @change="fetch"
        @focus="($event.target as HTMLSelectElement).style.borderColor='#f97316'"
        @blur="($event.target as HTMLSelectElement).style.borderColor='#2a2a2a'"
      >
        <option v-for="opt in entityTypes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Table card -->
    <div style="background:#1a1a1a;border:1px solid #222;border-radius:12px;overflow:hidden">
      <div v-if="pending" style="padding:40px;text-align:center;color:#71717a;font-size:0.875rem">
        Loading…
      </div>
      <table v-else style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key"
              style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e"
            >{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in fields"
            :key="row.id"
            style="border-bottom:1px solid #1e1e1e;transition:background 0.1s"
            @mouseenter="($event.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:12px 16px;color:#e5e5e5;font-size:0.875rem;font-weight:500">{{ row.label }}</td>
            <td style="padding:12px 16px;font-size:0.875rem">
              <code style="background:#111;border:1px solid #222;border-radius:5px;padding:2px 7px;font-size:0.75rem;color:#a3a3a3;font-family:monospace">{{ row.fieldKey }}</code>
            </td>
            <td style="padding:12px 16px">
              <span style="background:rgba(249,115,22,0.1);color:#f97316;border-radius:6px;padding:2px 8px;font-size:0.75rem;font-weight:500">
                {{ row.dataType }}
              </span>
            </td>
            <td style="padding:12px 16px;text-align:center">
              <span v-if="row.isRequired" style="color:#4ade80;font-size:1rem">✓</span>
              <span v-else style="color:#3f3f46;font-size:1rem">—</span>
            </td>
            <td style="padding:12px 16px;color:#71717a;font-size:0.875rem">{{ row.section }}</td>
            <td style="padding:12px 16px;color:#71717a;font-size:0.875rem;text-align:center">{{ row.displayOrder }}</td>
            <td style="padding:12px 16px">
              <button
                style="background:rgba(239,68,68,0.08);color:#f87171;border:none;border-radius:6px;padding:5px 8px;font-size:0.8rem;cursor:pointer;line-height:1"
                @click="deleteField(row.id)"
              >🗑</button>
            </td>
          </tr>
          <tr v-if="fields.length === 0">
            <td :colspan="columns.length" style="padding:40px;text-align:center;color:#71717a;font-size:0.875rem">
              No fields found for this entity type.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Field templates browser -->
    <FieldTemplatesBrowser v-model="showTemplates" @installed="onInstalled" />

    <!-- Create field modal -->
    <UModal v-model="showCreate">
      <div style="background:#1a1a1a;border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid #222">
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#fff">Add Custom Field</h2>
        </div>
        <div style="padding:20px">
          <FieldDefinitionForm :entity-type="entityType" @saved="onSaved" @cancel="showCreate = false" />
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { FieldDefinitionResponse } from '@inventory/contracts';

definePageMeta({ layout: 'admin' });

const { api } = useApi();
const showCreate = ref(false);
const showTemplates = ref(false);
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
  { watch: [entityType], server: false, default: () => [] as FieldDefinitionResponse[] },
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

function onInstalled() {
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
