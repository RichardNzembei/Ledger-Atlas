<template>
  <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <UFormGroup label="SKU" name="sku" required>
        <UInput v-model="form.sku" placeholder="PROD-001" />
      </UFormGroup>
      <UFormGroup label="Unit of Measure" name="unitOfMeasure">
        <UInput v-model="form.unitOfMeasure" placeholder="unit" />
      </UFormGroup>
    </div>

    <UFormGroup label="Name" name="name" required>
      <UInput v-model="form.name" placeholder="Product name" />
    </UFormGroup>

    <UFormGroup label="Category" name="category">
      <UInput v-model="form.category" placeholder="Electronics, Food, etc." />
    </UFormGroup>

    <div class="grid grid-cols-2 gap-4">
      <UFormGroup label="Selling Price" name="basePrice" required>
        <UInput v-model.number="form.basePrice" type="number" step="0.01" min="0" />
      </UFormGroup>
      <UFormGroup label="Cost Price" name="costPrice" required>
        <UInput v-model.number="form.costPrice" type="number" step="0.01" min="0" />
      </UFormGroup>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <UFormGroup label="Reorder Point" name="reorderPoint">
        <UInput v-model.number="form.reorderPoint" type="number" min="0" />
      </UFormGroup>
      <UFormGroup label="Reorder Qty" name="reorderQty">
        <UInput v-model.number="form.reorderQty" type="number" min="0" />
      </UFormGroup>
    </div>

    <!-- Dynamic custom fields -->
    <div v-if="customFields.length > 0">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Custom Fields</h3>
      <DynamicForm
        :fields="customFields"
        :submitting="false"
        @submit="(v) => { form.customFields = v; }"
        @cancel="$emit('cancel')"
      />
    </div>

    <UAlert v-if="error" color="red" :description="error" />

    <div class="flex gap-3 justify-end">
      <UButton type="button" variant="ghost" @click="$emit('cancel')">Cancel</UButton>
      <UButton type="submit" :loading="loading">Create Product</UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { CreateProductRequest, type FieldDefinitionResponse } from '@inventory/contracts';

const emit = defineEmits<{ saved: []; cancel: [] }>();

const { api } = useApi();
const schema = CreateProductRequest;
const loading = ref(false);
const error = ref('');

const form = reactive({
  sku: '',
  name: '',
  category: '',
  unitOfMeasure: 'unit',
  basePrice: 0,
  costPrice: 0,
  reorderPoint: undefined as number | undefined,
  reorderQty: undefined as number | undefined,
  customFields: {} as Record<string, unknown>,
});

const { data: customFields } = await useAsyncData(
  'product-custom-fields',
  () => api<FieldDefinitionResponse[]>('/api/v1/metadata/fields', { query: { entityType: 'product' } }),
  { default: () => [] as FieldDefinitionResponse[] },
);

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    await api('/api/v1/products', { method: 'POST', body: form });
    emit('saved');
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Failed to create product';
  } finally {
    loading.value = false;
  }
}
</script>
