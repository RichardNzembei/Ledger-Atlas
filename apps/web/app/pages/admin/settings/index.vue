<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Settings</h1>
      <div style="display:flex;gap:8px">
        <button
          style="background:#1a1a1a;color:#a3a3a3;border:1px solid #2a2a2a;border-radius:8px;padding:8px 14px;font-size:0.875rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px"
          @click="showPacks = true"
        >
          <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4" />
          Starter Packs
        </button>
        <button
          style="background:#f97316;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:0.875rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px"
          @click="startCreate"
        >
          <span style="font-size:1rem;line-height:1">+</span> Add Setting
        </button>
      </div>
    </div>

    <!-- Scope filter -->
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <select
        v-model="scopeType"
        style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;cursor:pointer;appearance:none;min-width:160px"
        @change="fetch"
        @focus="($event.target as HTMLSelectElement).style.borderColor='#f97316'"
        @blur="($event.target as HTMLSelectElement).style.borderColor='#2a2a2a'"
      >
        <option v-for="opt in scopeTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
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
            v-for="row in (data ?? [])"
            :key="(row as Record<string, unknown>)['key'] as string"
            style="border-bottom:1px solid #1e1e1e;transition:background 0.1s"
            @mouseenter="($event.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:12px 16px;font-size:0.875rem">
              <code style="color:#e5e5e5;font-family:monospace;font-size:0.8rem">{{ (row as Record<string, unknown>)['key'] }}</code>
            </td>
            <td style="padding:12px 16px">
              <span style="background:rgba(59,130,246,0.12);color:#60a5fa;border-radius:6px;padding:2px 8px;font-size:0.75rem;font-weight:500">
                {{ (row as Record<string, unknown>)['scopeType'] }}
              </span>
            </td>
            <td style="padding:12px 16px;color:#71717a;font-size:0.8rem;font-family:monospace">
              {{ (row as Record<string, unknown>)['scopeId'] ?? '—' }}
            </td>
            <td style="padding:12px 16px">
              <code style="background:#111;border:1px solid #222;border-radius:5px;padding:2px 8px;font-size:0.75rem;color:#a3a3a3;font-family:monospace">
                {{ JSON.stringify((row as Record<string, unknown>)['value']).slice(0, 60) }}
              </code>
            </td>
            <td style="padding:12px 16px">
              <button
                style="background:rgba(255,255,255,0.04);color:#a3a3a3;border:none;border-radius:6px;padding:5px 8px;font-size:0.8rem;cursor:pointer;line-height:1"
                @click="startEdit(row as Record<string, unknown>)"
              >✎</button>
            </td>
          </tr>
          <tr v-if="(data ?? []).length === 0">
            <td :colspan="columns.length" style="padding:40px;text-align:center;color:#71717a;font-size:0.875rem">
              No settings found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Starter packs browser -->
    <SettingsPacksBrowser v-model="showPacks" @installed="fetch" />

    <!-- Create / Edit modal -->
    <UModal v-model="showModal">
      <div style="background:#1a1a1a;border-radius:12px;overflow:hidden;min-width:480px">
        <!-- Modal header -->
        <div style="padding:16px 20px;border-bottom:1px solid #222">
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#fff">{{ editing ? 'Edit Setting' : 'New Setting' }}</h2>
        </div>

        <form style="padding:20px" @submit.prevent="save">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <!-- Scope -->
            <div>
              <label style="display:block;font-size:0.8rem;font-weight:500;color:#a3a3a3;margin-bottom:6px">
                Scope <span style="color:#f97316">*</span>
              </label>
              <select
                v-model="form.scopeType"
                style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;cursor:pointer;appearance:none"
                @focus="($event.target as HTMLSelectElement).style.borderColor='#f97316'"
                @blur="($event.target as HTMLSelectElement).style.borderColor='#2a2a2a'"
              >
                <option v-for="opt in scopeTypeOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <!-- Scope ID -->
            <div>
              <label style="display:block;font-size:0.8rem;font-weight:500;color:#a3a3a3;margin-bottom:6px">
                Scope ID
                <span style="font-weight:400;color:#52525b;font-size:0.75rem">
                  {{ form.scopeType === 'tenant' ? '(leave blank for tenant-wide)' : '(required for location/user)' }}
                </span>
              </label>
              <input
                v-model="form.scopeId"
                type="text"
                placeholder="UUID (optional for tenant scope)"
                style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;box-sizing:border-box"
                @focus="($event.target as HTMLInputElement).style.borderColor='#f97316'"
                @blur="($event.target as HTMLInputElement).style.borderColor='#2a2a2a'"
              />
            </div>
          </div>

          <!-- Key -->
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:0.8rem;font-weight:500;color:#a3a3a3;margin-bottom:6px">
              Key <span style="color:#f97316">*</span>
            </label>
            <input
              v-model="form.key"
              type="text"
              placeholder="feature.dark_mode"
              style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;box-sizing:border-box;font-family:monospace"
              @focus="($event.target as HTMLInputElement).style.borderColor='#f97316'"
              @blur="($event.target as HTMLInputElement).style.borderColor='#2a2a2a'"
            />
          </div>

          <!-- Value (JSON) -->
          <div style="margin-bottom:16px">
            <label style="display:block;font-size:0.8rem;font-weight:500;color:#a3a3a3;margin-bottom:6px">
              Value (JSON) <span style="color:#f97316">*</span>
            </label>
            <textarea
              v-model="form.valueRaw"
              :rows="3"
              placeholder='true, "string", 42, {"key": "value"}'
              style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;box-sizing:border-box;resize:vertical;font-family:monospace"
              @focus="($event.target as HTMLTextAreaElement).style.borderColor='#f97316'"
              @blur="($event.target as HTMLTextAreaElement).style.borderColor='#2a2a2a'"
            />
          </div>

          <!-- Error alert -->
          <div v-if="formError" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 14px;margin-bottom:16px">
            <p style="margin:0;font-size:0.875rem;color:#f87171">{{ formError }}</p>
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button
              type="button"
              style="background:transparent;color:#71717a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 16px;font-size:0.875rem;font-weight:500;cursor:pointer"
              @click="closeModal"
            >Cancel</button>
            <button
              type="submit"
              style="background:#f97316;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:0.875rem;font-weight:500;cursor:pointer"
              :style="saving ? 'opacity:0.6' : ''"
              :disabled="saving"
            >{{ saving ? 'Saving…' : (editing ? 'Update' : 'Create') }}</button>
          </div>
        </form>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' });

const { api } = useApi();
const scopeType = ref('');
const showModal = ref(false);
const showPacks = ref(false);
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
  { server: false, default: () => [] as unknown[] },
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
