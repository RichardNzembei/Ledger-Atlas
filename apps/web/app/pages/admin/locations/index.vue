<template>
  <div style="color:#fff">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <div>
        <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Locations</h1>
        <p style="font-size:0.8rem;color:#71717a;margin:0.25rem 0 0">Warehouses, stores, bins and virtual locations</p>
      </div>
      <button
        type="button"
        style="background:#f97316;color:#fff;border:none;border-radius:0.5rem;padding:0.5rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.4rem"
        @click="startCreate"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
        Add Location
      </button>
    </div>

    <!-- Table card -->
    <div style="background:#1a1a1a;border:1px solid #222;border-radius:0.75rem;overflow:hidden">
      <div v-if="pending" style="padding:3rem;text-align:center;color:#71717a;font-size:0.875rem">
        Loading locations…
      </div>

      <table v-else style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid #1e1e1e">
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Code</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Name</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Type</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Address</th>
            <th style="text-align:left;padding:0.75rem 1rem;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a">Status</th>
            <th style="padding:0.75rem 1rem;width:80px"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data ?? []"
            :key="row.id"
            style="border-bottom:1px solid #1e1e1e;transition:background 0.1s"
            @mouseenter="(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'"
            @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'"
          >
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#e5e5e5;font-family:monospace">{{ row.code }}</td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#fff;font-weight:500">{{ row.name }}</td>
            <td style="padding:0.75rem 1rem">
              <span :style="typeBadgeStyle(row.type)" style="display:inline-block;padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">
                {{ row.type }}
              </span>
            </td>
            <td style="padding:0.75rem 1rem;font-size:0.8rem;color:#71717a;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              {{ row.address || '—' }}
            </td>
            <td style="padding:0.75rem 1rem">
              <span
                :style="row.isActive
                  ? 'background:rgba(34,197,94,0.12);color:#4ade80'
                  : 'background:rgba(113,113,122,0.15);color:#71717a'"
                style="display:inline-block;padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:600"
              >
                {{ row.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td style="padding:0.75rem 1rem">
              <div style="display:flex;gap:0.5rem;align-items:center;justify-content:flex-end">
                <button
                  type="button"
                  title="Edit"
                  style="background:none;border:none;color:#71717a;cursor:pointer;padding:0.25rem;border-radius:0.25rem;display:flex;align-items:center;transition:color 0.1s"
                  @click="startEdit(row)"
                  @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'"
                  @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = '#71717a'"
                >
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/></svg>
                </button>
                <button
                  v-if="row.isActive"
                  type="button"
                  title="Deactivate"
                  style="background:none;border:none;color:#71717a;cursor:pointer;padding:0.25rem;border-radius:0.25rem;display:flex;align-items:center;transition:color 0.1s"
                  @click="deactivate(row.id)"
                  @mouseenter="(e) => (e.currentTarget as HTMLElement).style.color = '#ef4444'"
                  @mouseleave="(e) => (e.currentTarget as HTMLElement).style.color = '#71717a'"
                >
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!data?.length">
            <td colspan="6" style="padding:3rem;text-align:center;color:#71717a;font-size:0.875rem">No locations found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Modal -->
    <UModal v-model="showModal">
      <div style="background:#1a1a1a;border-radius:0.75rem;overflow:hidden;width:100%;max-width:520px">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:1rem;font-weight:600;color:#fff;margin:0">{{ editing ? 'Edit Location' : 'New Location' }}</h2>
          <button type="button" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:1.25rem;line-height:1;padding:0" @click="closeModal">&#x2715;</button>
        </div>
        <form style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem" @submit.prevent="save">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Code <span style="color:#f97316">*</span></label>
              <input
                v-model="form.code"
                type="text"
                placeholder="WH-001"
                required
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Name <span style="color:#f97316">*</span></label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Main Warehouse"
                required
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Type <span style="color:#f97316">*</span></label>
              <select
                v-model="form.type"
                required
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              >
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Parent Location</label>
              <select
                v-model="form.parentId"
                style="width:100%;background:#111;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;box-sizing:border-box"
              >
                <option value="">None</option>
                <option v-for="opt in locationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:500;color:#71717a;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em">Address</label>
            <textarea
              v-model="form.address"
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

type Location = { id: string; name: string; code: string; type: string; isActive: boolean; address?: string; parentId?: string };

const { data, pending, refresh } = await useAsyncData('locations', () =>
  api<Location[]>('/api/v1/locations', { query: { limit: 200 } }),
  { server: false, default: () => [] as Location[] },
);

const locationOptions = computed(
  () => (data.value ?? []).filter((l) => l.isActive).map((l) => ({ label: `${l.code} — ${l.name}`, value: l.id })),
);

function typeColor(t: string) {
  return { warehouse: 'blue', store: 'green', bin: 'gray', virtual: 'purple' }[t] ?? 'gray';
}

function typeBadgeStyle(t: string) {
  const map: Record<string, string> = {
    warehouse: 'background:rgba(59,130,246,0.15);color:#60a5fa',
    store: 'background:rgba(34,197,94,0.12);color:#4ade80',
    bin: 'background:rgba(113,113,122,0.15);color:#a1a1aa',
    virtual: 'background:rgba(168,85,247,0.15);color:#c084fc',
  };
  return map[t] ?? 'background:rgba(113,113,122,0.15);color:#a1a1aa';
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
