<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UFormGroup label="Field Key" name="fieldKey" required>
      <UInput v-model="form.fieldKey" placeholder="warranty_expiry" :disabled="!!fieldId" />
      <template #hint>
        <span class="text-xs text-gray-500">snake_case, used in API and custom field storage{{ fieldId ? ' (immutable)' : '' }}</span>
      </template>
    </UFormGroup>

    <UFormGroup label="Label" name="label" required>
      <UInput v-model="form.label" placeholder="Warranty Expiry" />
    </UFormGroup>

    <div class="grid grid-cols-2 gap-4">
      <UFormGroup label="Type" name="dataType" required>
        <USelect v-model="form.dataType" :options="dataTypes" value-attribute="value" option-attribute="label" :disabled="!!fieldId" />
      </UFormGroup>
      <UFormGroup label="Section" name="section">
        <UInput v-model="form.section" placeholder="General" />
      </UFormGroup>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <UFormGroup label="Display Order" name="displayOrder">
        <UInput v-model.number="form.displayOrder" type="number" min="0" />
      </UFormGroup>
      <UFormGroup label="Required" name="isRequired">
        <UToggle v-model="form.isRequired" />
      </UFormGroup>
      <UFormGroup label="Indexed" name="isIndexed">
        <UToggle v-model="form.isIndexed" />
        <template #hint>
          <span class="text-xs text-gray-500">Faster filtering in reports</span>
        </template>
      </UFormGroup>
    </div>

    <!-- Enum options -->
    <div v-if="form.dataType === 'enum'" class="space-y-2">
      <label class="text-sm font-medium">Options</label>
      <div v-for="(opt, i) in enumOptions" :key="i" class="flex gap-2">
        <UInput v-model="opt.value" placeholder="value" class="flex-1" />
        <UInput v-model="opt.label" placeholder="Label" class="flex-1" />
        <UButton icon="i-heroicons-trash" variant="ghost" color="red" size="xs" @click="enumOptions.splice(i, 1)" />
      </div>
      <UButton size="xs" variant="outline" @click="enumOptions.push({ value: '', label: '' })">+ Option</UButton>
    </div>

    <UAlert v-if="error" color="red" :description="error" />

    <div class="flex gap-3 justify-end">
      <UButton type="button" variant="ghost" @click="$emit('cancel')">Cancel</UButton>
      <UButton type="submit" :loading="loading">{{ fieldId ? 'Update Field' : 'Add Field' }}</UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { CreateFieldDefinitionRequest } from '@inventory/contracts';
import type { FieldDefinitionResponse } from '@inventory/contracts';

const props = defineProps<{
  entityType: string;
  fieldId?: string;
  initialValues?: Partial<FieldDefinitionResponse>;
}>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const { api } = useApi();
const loading = ref(false);
const error = ref('');
const enumOptions = ref<Array<{ value: string; label: string }>>(
  (props.initialValues?.config?.options as Array<{ value: string; label: string }> | undefined) ?? [],
);

const form = reactive({
  fieldKey: props.initialValues?.fieldKey ?? '',
  label: props.initialValues?.label ?? '',
  dataType: (props.initialValues?.dataType ?? 'string') as string,
  section: props.initialValues?.section ?? '',
  displayOrder: props.initialValues?.displayOrder ?? 0,
  isRequired: props.initialValues?.isRequired ?? false,
  isIndexed: props.initialValues?.isIndexed ?? false,
});

const dataTypes = [
  { label: 'Text (short)', value: 'string' },
  { label: 'Text (long)', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Decimal', value: 'decimal' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Date & Time', value: 'datetime' },
  { label: 'Enum (dropdown)', value: 'enum' },
];

async function onSubmit() {
  const config: Record<string, unknown> = {};
  if (form.dataType === 'enum') config['options'] = enumOptions.value;

  loading.value = true;
  error.value = '';

  try {
    if (props.fieldId) {
      await api(`/api/v1/metadata/fields/${props.fieldId}`, {
        method: 'PATCH',
        body: {
          label: form.label,
          config,
          isRequired: form.isRequired,
          isIndexed: form.isIndexed,
          displayOrder: form.displayOrder,
          section: form.section || null,
        },
      });
    } else {
      const parsed = CreateFieldDefinitionRequest.safeParse({
        ...form,
        entityType: props.entityType,
        config,
      });
      if (!parsed.success) {
        error.value = parsed.error.issues[0]?.message ?? 'Validation failed';
        return;
      }
      await api('/api/v1/metadata/fields', { method: 'POST', body: parsed.data });
    }
    emit('saved');
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Failed to save field';
  } finally {
    loading.value = false;
  }
}
</script>
