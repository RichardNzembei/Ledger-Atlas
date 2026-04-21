<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Business Rules</h1>
      <UButton icon="i-heroicons-plus" @click="showCreate = true">New Rule</UButton>
    </div>

    <!-- Engine tabs -->
    <UTabs v-model="activeEngine" :items="engineTabs" class="mb-4" />

    <UCard>
      <UTable :rows="filteredRules" :columns="columns" :loading="pending">
        <template #engine-data="{ row }">
          <UBadge :color="engineColor(row.engine)" :label="row.engine" variant="soft" />
        </template>
        <template #isActive-data="{ row }">
          <UBadge :color="row.isActive ? 'green' : 'gray'" :label="row.isActive ? 'Active' : 'Draft'" />
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-1">
            <UButton
              v-if="!row.isActive"
              size="xs"
              color="green"
              variant="ghost"
              label="Activate"
              @click="activateRule(row.id)"
            />
            <UButton
              v-else
              size="xs"
              color="orange"
              variant="ghost"
              label="Deactivate"
              @click="deactivateRule(row.id)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Create rule modal -->
    <UModal v-model="showCreate" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">New Rule</h2>
            <UButton icon="i-heroicons-sparkles" variant="ghost" size="sm" @click="showAiAssist = !showAiAssist">
              AI Assist
            </UButton>
          </div>
        </template>

        <div v-if="showAiAssist" class="mb-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
          <p class="text-sm font-medium mb-2">Describe the rule in plain English</p>
          <UTextarea v-model="nlDescription" placeholder="e.g. When a retail customer buys more than 10 units of any product in the Dairy category, apply a 5% discount." />
          <UButton class="mt-2" size="sm" :loading="aiLoading" @click="generateRule">Generate</UButton>
        </div>

        <RuleForm :initial="newRule" @saved="onSaved" @cancel="showCreate = false" />
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { RuleResponse } from '@inventory/contracts';

definePageMeta({ layout: 'admin' });

const { api } = useApi();
const showCreate = ref(false);
const showAiAssist = ref(false);
const nlDescription = ref('');
const aiLoading = ref(false);
const newRule = ref({});
const activeEngine = ref(0);

const engineTabs = [
  { label: 'All', slot: 'all' },
  { label: 'Reactive', slot: 'reactive' },
  { label: 'Decision', slot: 'decision' },
  { label: 'Validation', slot: 'validation' },
  { label: 'Policy', slot: 'policy' },
];

const { data: rules, pending, refresh } = await useAsyncData(
  'rules',
  () => api<RuleResponse[]>('/api/v1/metadata/rules'),
  { default: () => [] as RuleResponse[] },
);

const filteredRules = computed(() => {
  if (activeEngine.value === 0) return rules.value;
  const engines = ['reactive', 'decision', 'validation', 'policy'];
  const engine = engines[activeEngine.value - 1];
  return rules.value.filter((r) => r.engine === engine);
});

async function activateRule(id: string) {
  await api(`/api/v1/metadata/rules/${id}/activate`, { method: 'POST' });
  void refresh();
}

async function deactivateRule(id: string) {
  await api(`/api/v1/metadata/rules/${id}/deactivate`, { method: 'POST' });
  void refresh();
}

async function generateRule() {
  aiLoading.value = true;
  // Phase 9: call LLM endpoint to translate nlDescription to structured rule
  // For now, just a placeholder
  await new Promise((r) => setTimeout(r, 500));
  aiLoading.value = false;
}

function onSaved() {
  showCreate.value = false;
  void refresh();
}

function engineColor(engine: string) {
  const map: Record<string, string> = {
    reactive: 'blue',
    decision: 'purple',
    validation: 'yellow',
    policy: 'red',
  };
  return map[engine] ?? 'gray';
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'engine', label: 'Engine' },
  { key: 'triggerEvent', label: 'Trigger' },
  { key: 'priority', label: 'Priority' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: '' },
];
</script>
