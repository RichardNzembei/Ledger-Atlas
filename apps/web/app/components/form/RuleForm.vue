<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UFormGroup label="Name" name="name" required>
      <UInput v-model="form.name" />
    </UFormGroup>

    <UFormGroup label="Engine" name="engine" required>
      <USelect v-model="form.engine" :options="engineOptions" value-attribute="value" option-attribute="label" />
    </UFormGroup>

    <UFormGroup v-if="form.engine === 'reactive'" label="Trigger Event" name="triggerEvent">
      <UInput v-model="form.triggerEvent" placeholder="e.g. stock.below_reorder" />
    </UFormGroup>

    <UFormGroup label="Priority" name="priority">
      <UInput v-model.number="form.priority" type="number" min="1" max="1000" />
    </UFormGroup>

    <UFormGroup label="Description" name="description">
      <UTextarea v-model="form.description" />
    </UFormGroup>

    <UFormGroup label="Rule Body (JSON)" name="body" required>
      <UTextarea v-model="bodyJson" rows="10" class="font-mono text-xs" :error="bodyError" />
      <template #hint>
        <span class="text-xs text-gray-500">Enter valid JSON matching the {{ form.engine }} engine format.</span>
      </template>
    </UFormGroup>

    <UAlert v-if="error" color="red" :description="error" />

    <div class="flex gap-3 justify-end">
      <UButton type="button" variant="ghost" @click="$emit('cancel')">Cancel</UButton>
      <UButton type="submit" :loading="loading">Save Rule</UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { CreateRuleRequest } from '@inventory/contracts';

const emit = defineEmits<{ saved: []; cancel: [] }>();
const props = defineProps<{ initial?: Record<string, unknown> }>();

const { api } = useApi();
const loading = ref(false);
const error = ref('');
const bodyError = ref('');
const bodyJson = ref('{}');

const form = reactive({
  name: '',
  engine: 'reactive' as 'validation' | 'decision' | 'reactive' | 'policy',
  triggerEvent: '',
  priority: 100,
  description: '',
  ...props.initial,
});

const engineOptions = [
  { label: 'Reactive', value: 'reactive' },
  { label: 'Decision Table', value: 'decision' },
  { label: 'Validation', value: 'validation' },
  { label: 'Policy', value: 'policy' },
];

async function onSubmit() {
  bodyError.value = '';
  let body: unknown;
  try {
    body = JSON.parse(bodyJson.value);
  } catch {
    bodyError.value = 'Invalid JSON';
    return;
  }

  const parsed = CreateRuleRequest.safeParse({ ...form, body });
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Validation failed';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    await api('/api/v1/metadata/rules', { method: 'POST', body: parsed.data });
    emit('saved');
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Failed to save rule';
  } finally {
    loading.value = false;
  }
}
</script>
