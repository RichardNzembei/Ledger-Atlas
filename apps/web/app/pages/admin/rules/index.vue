<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Business Rules</h1>
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
          @click="newRule = {}; formKey++; showCreate = true"
        >
          <span style="font-size:1rem;line-height:1">+</span> New Rule
        </button>
      </div>
    </div>

    <!-- Engine tabs -->
    <div style="display:flex;gap:4px;margin-bottom:16px;background:#111;border:1px solid #222;border-radius:10px;padding:4px;width:fit-content">
      <button
        v-for="(tab, i) in engineTabs"
        :key="tab.label"
        style="border:none;border-radius:7px;padding:6px 14px;font-size:0.8rem;font-weight:500;cursor:pointer;transition:background 0.15s,color 0.15s"
        :style="activeEngine === i
          ? 'background:#f97316;color:#fff'
          : 'background:transparent;color:#71717a'"
        @click="activeEngine = i"
      >
        {{ tab.label }}
      </button>
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
            v-for="row in filteredRules"
            :key="row.id"
            style="border-bottom:1px solid #1e1e1e;transition:background 0.1s"
            @mouseenter="($event.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
          >
            <td style="padding:12px 16px;color:#e5e5e5;font-size:0.875rem">
              {{ row.name }}
              <span
                v-if="isParseError(row)"
                style="margin-left:6px;background:rgba(239,68,68,0.12);color:#f87171;border-radius:4px;padding:1px 6px;font-size:0.68rem;font-weight:600;vertical-align:middle"
                title="Rule body is missing required structure — rule will be skipped at runtime"
              >parse error</span>
            </td>
            <td style="padding:12px 16px">
              <span :style="engineBadgeStyle(row.engine)" style="border-radius:6px;padding:2px 8px;font-size:0.75rem;font-weight:500">
                {{ row.engine }}
              </span>
            </td>
            <td style="padding:12px 16px;color:#71717a;font-size:0.875rem">{{ row.triggerEvent }}</td>
            <td style="padding:12px 16px;color:#e5e5e5;font-size:0.875rem">{{ row.priority }}</td>
            <td style="padding:12px 16px">
              <span
                :style="row.isActive
                  ? 'background:rgba(34,197,94,0.12);color:#4ade80'
                  : 'background:rgba(113,113,122,0.15);color:#71717a'"
                style="border-radius:6px;padding:2px 8px;font-size:0.75rem;font-weight:500"
              >
                {{ row.isActive ? 'Active' : 'Draft' }}
              </span>
            </td>
            <td style="padding:12px 16px">
              <div style="display:flex;gap:6px;align-items:center">
                <button
                  v-if="!row.isActive"
                  style="background:rgba(34,197,94,0.1);color:#4ade80;border:none;border-radius:6px;padding:4px 10px;font-size:0.75rem;cursor:pointer;font-weight:500"
                  @click="activateRule(row.id)"
                >Activate</button>
                <button
                  v-else
                  style="background:rgba(249,115,22,0.1);color:#f97316;border:none;border-radius:6px;padding:4px 10px;font-size:0.75rem;cursor:pointer;font-weight:500"
                  @click="deactivateRule(row.id)"
                >Deactivate</button>
                <button
                  style="background:rgba(255,255,255,0.04);color:#52525b;border:none;border-radius:6px;padding:4px 8px;font-size:0.72rem;cursor:pointer"
                  title="View rule execution log"
                  @click="openRuleLog(row)"
                >Log</button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredRules.length === 0">
            <td :colspan="columns.length" style="padding:40px;text-align:center;color:#71717a;font-size:0.875rem">
              No rules found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rule execution log modal -->
    <UModal v-model="showRuleLog">
      <div style="background:#1a1a1a;border-radius:12px;overflow:hidden;min-width:560px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #222">
          <div>
            <h3 style="margin:0;font-size:0.9rem;font-weight:600;color:#fff">Rule Execution Log</h3>
            <p style="margin:2px 0 0;font-size:0.75rem;color:#52525b">{{ selectedRule?.name }}</p>
          </div>
          <button style="background:transparent;border:none;color:#52525b;cursor:pointer" @click="showRuleLog = false">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
        <div style="max-height:400px;overflow-y:auto;padding:12px 0">
          <div v-if="ruleLogPending" style="padding:24px;text-align:center;color:#71717a;font-size:0.875rem">Loading…</div>
          <template v-else-if="ruleLog.length > 0">
            <div
              v-for="entry in ruleLog"
              :key="entry.id"
              style="display:grid;grid-template-columns:140px 80px 1fr;gap:8px;padding:8px 18px;border-bottom:1px solid #1a1a1a;font-size:0.8rem"
            >
              <span style="color:#52525b">{{ formatLogTime(entry.occurredAt) }}</span>
              <span :style="logResultStyle(entry.payload)" style="border-radius:4px;padding:1px 6px;font-size:0.7rem;font-weight:600;text-align:center">
                {{ (entry.payload as Record<string,unknown>)['result'] }}
              </span>
              <span style="color:#a3a3a3">{{ logDetail(entry.payload) }}</span>
            </div>
          </template>
          <div v-else style="padding:24px;text-align:center;color:#71717a;font-size:0.875rem">
            No executions recorded yet for this rule.
          </div>
        </div>
      </div>
    </UModal>

    <!-- Template browser -->
    <RuleTemplatesBrowser v-model="showTemplates" @use="applyTemplate" />

    <!-- Create rule modal -->
    <UModal v-model="showCreate" :ui="{ width: 'sm:max-w-2xl' }">
      <div style="background:#1a1a1a;border-radius:12px;overflow:hidden">
        <!-- Modal header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #222">
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#fff">New Rule</h2>
          <button
            style="background:rgba(168,85,247,0.1);color:#a855f7;border:none;border-radius:6px;padding:5px 10px;font-size:0.75rem;cursor:pointer;font-weight:500;display:flex;align-items:center;gap:4px"
            @click="showAiAssist = !showAiAssist"
          >
            ✦ AI Assist
          </button>
        </div>

        <div style="padding:20px">
          <!-- AI assist panel -->
          <div v-if="showAiAssist" style="margin-bottom:16px;padding:16px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:10px">
            <p style="margin:0 0 8px;font-size:0.875rem;font-weight:500;color:#e5e5e5">Describe the rule in plain English</p>
            <textarea
              v-model="nlDescription"
              placeholder="e.g. When a retail customer buys more than 10 units of any product in the Dairy category, apply a 5% discount."
              rows="3"
              style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#e5e5e5;outline:none;width:100%;box-sizing:border-box;resize:vertical;font-family:inherit"
              @focus="($event.target as HTMLTextAreaElement).style.borderColor='#f97316'"
              @blur="($event.target as HTMLTextAreaElement).style.borderColor='#2a2a2a'"
            />
            <button
              style="margin-top:8px;background:#f97316;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:0.875rem;font-weight:500;cursor:pointer"
              :disabled="aiLoading"
              :style="aiLoading ? 'opacity:0.6' : ''"
              @click="generateRule"
            >
              {{ aiLoading ? 'Generating…' : 'Generate' }}
            </button>
          </div>

          <RuleForm :key="formKey" :initial="newRule" @saved="onSaved" @cancel="showCreate = false" />
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import RuleForm from '~/components/RuleForm.vue';
import type { RuleResponse } from '@inventory/contracts';
import type { RuleTemplate } from '~/composables/useRuleTemplates';

definePageMeta({ layout: 'admin' });

const { api } = useApi();
const showCreate = ref(false);
const showTemplates = ref(false);
const showAiAssist = ref(false);
const showRuleLog = ref(false);
const selectedRule = ref<RuleResponse | null>(null);
const ruleLogPending = ref(false);
const ruleLog = ref<Array<{ id: string; payload: unknown; occurredAt: string }>>([]);
const nlDescription = ref('');
const aiLoading = ref(false);
const newRule = ref<Record<string, unknown>>({});
const formKey = ref(0);
const activeEngine = ref(0);

function applyTemplate(tmpl: RuleTemplate) {
  newRule.value = {
    name: tmpl.name,
    engine: tmpl.engine,
    triggerEvent: tmpl.triggerEvent ?? '',
    priority: tmpl.priority,
    description: tmpl.scenario,
    body: tmpl.body,
  };
  formKey.value++;
  showCreate.value = true;
}

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
  { server: false, default: () => [] as RuleResponse[] },
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

async function openRuleLog(rule: RuleResponse) {
  selectedRule.value = rule;
  showRuleLog.value = true;
  ruleLogPending.value = true;
  try {
    ruleLog.value = await api<Array<{ id: string; payload: unknown; occurredAt: string }>>(
      `/api/v1/audit-log/rule-log/${rule.id}`,
    );
  } finally {
    ruleLogPending.value = false;
  }
}

function isParseError(rule: RuleResponse): boolean {
  if (!rule.body || typeof rule.body !== 'object') return true;
  const body = rule.body as Record<string, unknown>;
  if (rule.engine === 'reactive') return !Array.isArray(body['conditions']) || !Array.isArray(body['actions']);
  if (rule.engine === 'validation') return !Array.isArray(body['conditions']);
  if (rule.engine === 'policy') return !Array.isArray(body['conditions']);
  if (rule.engine === 'decision') return !Array.isArray(body['rows']);
  return false;
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' });
}

function logResultStyle(payload: unknown): string {
  const result = (payload as Record<string, unknown>)['result'];
  if (result === 'fired' || result === 'passed') return 'background:rgba(34,197,94,0.12);color:#4ade80';
  if (result === 'failed' || result === 'denied') return 'background:rgba(239,68,68,0.12);color:#f87171';
  return 'background:rgba(113,113,122,0.12);color:#71717a';
}

function logDetail(payload: unknown): string {
  const p = payload as Record<string, unknown>;
  if (p['errorMessage']) return p['errorMessage'] as string;
  if (p['reason']) return p['reason'] as string;
  if (p['trigger']) return `trigger: ${p['trigger']}`;
  return '—';
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

function engineBadgeStyle(engine: string) {
  const map: Record<string, string> = {
    reactive: 'background:rgba(59,130,246,0.12);color:#60a5fa',
    decision: 'background:rgba(168,85,247,0.12);color:#c084fc',
    validation: 'background:rgba(234,179,8,0.12);color:#facc15',
    policy: 'background:rgba(239,68,68,0.12);color:#f87171',
  };
  return map[engine] ?? 'background:rgba(113,113,122,0.15);color:#71717a';
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
