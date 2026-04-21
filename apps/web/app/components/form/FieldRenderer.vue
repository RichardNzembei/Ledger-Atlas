<template>
  <UFormGroup :label="field.label" :name="field.fieldKey" :error="error" :required="field.isRequired">
    <!-- String / text -->
    <UInput
      v-if="field.dataType === 'string'"
      :model-value="modelValue as string"
      :placeholder="cfg.placeholder as string"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <UTextarea
      v-else-if="field.dataType === 'text'"
      :model-value="modelValue as string"
      :placeholder="cfg.placeholder as string"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Number / decimal -->
    <UInput
      v-else-if="field.dataType === 'number' || field.dataType === 'decimal'"
      type="number"
      :model-value="modelValue as number"
      :min="cfg.min as number | undefined"
      :max="cfg.max as number | undefined"
      :step="field.dataType === 'decimal' ? '0.01' : '1'"
      @update:model-value="$emit('update:modelValue', Number($event))"
    />

    <!-- Boolean -->
    <UToggle
      v-else-if="field.dataType === 'boolean'"
      :model-value="modelValue as boolean"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Date -->
    <UInput
      v-else-if="field.dataType === 'date'"
      type="date"
      :model-value="modelValue as string"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Datetime -->
    <UInput
      v-else-if="field.dataType === 'datetime'"
      type="datetime-local"
      :model-value="modelValue as string"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Enum -->
    <USelect
      v-else-if="field.dataType === 'enum'"
      :model-value="modelValue as string"
      :options="enumOptions"
      value-attribute="value"
      option-attribute="label"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Reference / JSON — fallback to text -->
    <UInput
      v-else
      :model-value="typeof modelValue === 'string' ? modelValue : JSON.stringify(modelValue ?? '')"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <template v-if="cfg.helpText" #hint>
      <span class="text-xs text-gray-500">{{ cfg.helpText }}</span>
    </template>
  </UFormGroup>
</template>

<script setup lang="ts">
import type { FieldDefinitionResponse } from '@inventory/contracts';

const props = defineProps<{
  field: FieldDefinitionResponse;
  modelValue: unknown;
  error?: string;
}>();

defineEmits<{ 'update:modelValue': [value: unknown] }>();

const cfg = computed(() => (props.field.config as Record<string, unknown>) ?? {});

const enumOptions = computed(() => {
  const opts = (cfg.value['options'] as Array<{ value: string; label: string }> | undefined) ?? [];
  return opts;
});
</script>
