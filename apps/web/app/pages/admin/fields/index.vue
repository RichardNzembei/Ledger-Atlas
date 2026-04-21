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
          @click="startCreate"
        >
          <span style="font-size:1rem;line-height:1">+</span> Add Field
        </button>
      </div>
    </div>

    <!-- Filters row -->
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
      <select
        v-model="entityType"
        style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;cursor:pointer;appearance:none;min-width:160px"
        @focus="($event.target as HTMLSelectElement).style.borderColor='#f97316'"
        @blur="($event.target as HTMLSelectElement).style.borderColor='#2a2a2a'"
      >
        <option v-for="opt in entityTypes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>

      <label style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:#71717a;cursor:pointer;user-select:none">
        <input
          v-model="showInactive"
          type="checkbox"
          style="accent-color:#f97316;width:14px;height:14px;cursor:pointer"
        />
        Show inactive
      </label>
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
            :style="!row.isActive ? 'opacity:0.55' : ''"
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
            <td style="padding:12px 16px;text-align:center">
              <span v-if="row.isIndexed" style="color:#60a5fa;font-size:0.7rem;font-weight:600;background:rgba(59,130,246,0.1);border-radius:4px;padding:2px 6px">IDX</span>
              <span v-else style="color:#3f3f46;font-size:1rem">—</span>
            </td>
            <td style="padding:12px 16px;color:#71717a;font-size:0.875rem">{{ row.section ?? '—' }}</td>
            <td style="padding:12px 16px">
              <span
                :style="row.isActive
                  ? 'background:rgba(34,197,94,0.1);color:#4ade80'
                  : 'background:rgba(113,113,122,0.12);color:#71717a'"
                style="border-radius:6px;padding:2px 8px;font-size:0.75rem;font-weight:500"
              >
                {{ row.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td style="padding:12px 16px">
              <div style="display:flex;gap:6px">
                <button
                  style="background:rgba(255,255,255,0.04);color:#a3a3a3;border:none;border-radius:6px;padding:5px 8px;font-size:0.8rem;cursor:pointer;line-height:1"
                  title="Edit"
                  @click="startEdit(row)"
                >✎</button>
                <button
                  v-if="row.isActive"
                  style="background:rgba(113,113,122,0.1);color:#71717a;border:none;border-radius:6px;padding:4px 8px;font-size:0.7rem;cursor:pointer;font-weight:500"
                  title="Deactivate"
                  @click="toggleActive(row, false)"
                >Deactivate</button>
                <button
                  v-else
                  style="background:rgba(34,197,94,0.1);color:#4ade80;border:none;border-radius:6px;padding:4px 8px;font-size:0.7rem;cursor:pointer;font-weight:500"
                  title="Reactivate"
                  @click="toggleActive(row, true)"
                >Activate</button>
              </div>
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

    <!-- Create / Edit modal -->
    <UModal v-model="showModal">
      <div style="background:#1a1a1a;border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid #222">
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#fff">{{ editingField ? 'Edit Field' : 'Add Custom Field' }}</h2>
        </div>
        <div style="padding:20px">
          <FieldDefinitionForm
            :key="modalKey"
            :entity-type="entityType"
            :field-id="editingField?.id"
            :initial-values="editingField ?? undefined"
            @saved="onSaved"
            @cancel="showModal = false"
          />
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import FieldDefinitionForm from '~/components/FieldDefinitionForm.vue';
import type { FieldDefinitionResponse } from '@inventory/contracts';

definePageMeta({ layout: 'admin' });

const { api } = useApi();
const showModal = ref(false);
const showTemplates = ref(false);
const showInactive = ref(false);
const entityType = ref('product');
const editingField = ref<FieldDefinitionResponse | null>(null);
const modalKey = ref(0);

const entityTypes = [
  { label: 'Product', value: 'product' },
  { label: 'Asset', value: 'asset' },
  { label: 'Customer', value: 'customer' },
];

const { data: fields, pending, refresh } = await useAsyncData(
  () => `fields-${entityType.value}-${showInactive.value}`,
  () =>
    api<FieldDefinitionResponse[]>('/api/v1/metadata/fields', {
      query: {
        entityType: entityType.value,
        ...(showInactive.value ? {} : { isActive: 'true' }),
      },
    }),
  { watch: [entityType, showInactive], server: false, default: () => [] as FieldDefinitionResponse[] },
);

function startCreate() {
  editingField.value = null;
  modalKey.value++;
  showModal.value = true;
}

function startEdit(field: FieldDefinitionResponse) {
  editingField.value = field;
  modalKey.value++;
  showModal.value = true;
}

async function toggleActive(field: FieldDefinitionResponse, active: boolean) {
  await api(`/api/v1/metadata/fields/${field.id}`, {
    method: 'PATCH',
    body: { isActive: active },
  });
  void refresh();
}

function onSaved() {
  showModal.value = false;
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
  { key: 'isIndexed', label: 'Indexed' },
  { key: 'section', label: 'Section' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: '' },
];
</script>
