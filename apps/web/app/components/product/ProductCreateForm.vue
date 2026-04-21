<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">SKU <span class="text-orange-500">*</span></label>
        <input v-model="form.sku" type="text" placeholder="PROD-001" required
          class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
          style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">Unit of Measure</label>
        <input v-model="form.unitOfMeasure" type="text" placeholder="unit"
          class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
          style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
      </div>
    </div>

    <div>
      <label class="block text-xs font-medium text-zinc-400 mb-1">Name <span class="text-orange-500">*</span></label>
      <input v-model="form.name" type="text" placeholder="Product name" required
        class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
        style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
    </div>

    <div>
      <label class="block text-xs font-medium text-zinc-400 mb-1">Category</label>
      <input v-model="form.category" type="text" placeholder="Electronics, Food, etc."
        class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
        style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">Selling Price <span class="text-orange-500">*</span></label>
        <input v-model.number="form.basePrice" type="number" step="0.01" min="0" required
          class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
          style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">Cost Price <span class="text-orange-500">*</span></label>
        <input v-model.number="form.costPrice" type="number" step="0.01" min="0" required
          class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
          style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">Reorder Point</label>
        <input v-model.number="form.reorderPoint" type="number" min="0"
          class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
          style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">Reorder Qty</label>
        <input v-model.number="form.reorderQty" type="number" min="0"
          class="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500 transition-colors"
          style="background:#111;border-color:#2a2a2a;color:#e5e5e5" />
      </div>
    </div>

    <div v-if="error" class="px-3 py-2 rounded-lg text-sm" style="background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.2)">
      {{ error }}
    </div>

    <div class="flex gap-2 justify-end pt-1">
      <button type="button" class="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors" @click="$emit('cancel')">
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        style="background:#f97316;color:#fff"
      >
        {{ loading ? 'Saving…' : (props.initial?.id ? 'Save Changes' : 'Create Product') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const emit = defineEmits<{ saved: []; cancel: [] }>();
const props = defineProps<{ initial?: Record<string, unknown> }>();

const { api } = useApi();
const loading = ref(false);
const error = ref('');

const form = reactive({
  sku: (props.initial?.sku as string) ?? '',
  name: (props.initial?.name as string) ?? '',
  category: (props.initial?.category as string) ?? '',
  unitOfMeasure: (props.initial?.unitOfMeasure as string) ?? 'unit',
  basePrice: (props.initial?.basePrice as number) ?? 0,
  costPrice: (props.initial?.costPrice as number) ?? 0,
  reorderPoint: (props.initial?.reorderPoint as number | undefined) ?? undefined,
  reorderQty: (props.initial?.reorderQty as number | undefined) ?? undefined,
  customFields: (props.initial?.customFields as Record<string, unknown>) ?? {},
});

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    if (props.initial?.id) {
      await api(`/api/v1/products/${props.initial.id}`, { method: 'PATCH', body: form });
    } else {
      await api('/api/v1/products', { method: 'POST', body: form });
    }
    emit('saved');
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Failed to save product';
  } finally {
    loading.value = false;
  }
}
</script>
