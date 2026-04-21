<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <!-- Group fields by section -->
    <div v-for="(sectionFields, sectionName) in groupedFields" :key="sectionName">
      <h3 v-if="sectionName !== '_default'" class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {{ sectionName }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRenderer
          v-for="field in sectionFields"
          :key="field.fieldKey"
          :field="field"
          :model-value="values[field.fieldKey]"
          :error="errors[field.fieldKey]"
          @update:model-value="(v) => setFieldValue(field.fieldKey, v)"
        />
      </div>
    </div>

    <div class="flex gap-3 justify-end">
      <UButton type="button" variant="ghost" @click="$emit('cancel')">Cancel</UButton>
      <UButton type="submit" :loading="submitting">Save</UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { FieldDefinitionResponse } from '@inventory/contracts';
import { buildSchemaFromFields } from '~/composables/useDynamicForm';

const props = defineProps<{
  fields: FieldDefinitionResponse[];
  initialValues?: Record<string, unknown>;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [values: Record<string, unknown>];
  cancel: [];
}>();

const values = reactive<Record<string, unknown>>({ ...props.initialValues });
const errors = ref<Record<string, string>>({});

function setFieldValue(key: string, val: unknown) {
  values[key] = val;
  if (errors.value[key]) errors.value[key] = '';
}

const groupedFields = computed(() => {
  const groups: Record<string, FieldDefinitionResponse[]> = {};
  for (const field of props.fields) {
    const key = field.section ?? '_default';
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(field);
  }
  return groups;
});

function onSubmit() {
  const schema = buildSchemaFromFields(props.fields);
  const result = schema.safeParse(values);
  if (!result.success) {
    errors.value = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (path) errors.value[path] = issue.message;
    }
    return;
  }
  emit('submit', result.data as Record<string, unknown>);
}
</script>
