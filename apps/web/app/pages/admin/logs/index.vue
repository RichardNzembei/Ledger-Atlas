<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <div>
        <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Rule Execution Log</h1>
        <p style="margin:4px 0 0;font-size:0.8rem;color:#52525b">Recent rule evaluations — validation failures, policy denials, reactive firings</p>
      </div>
      <button
        style="background:#1a1a1a;color:#a3a3a3;border:1px solid #2a2a2a;border-radius:8px;padding:8px 14px;font-size:0.875rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px"
        @click="refresh"
      >
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
        Refresh
      </button>
    </div>

    <div style="background:#1a1a1a;border:1px solid #222;border-radius:12px;overflow:hidden">
      <div v-if="pending" style="padding:40px;text-align:center;color:#71717a;font-size:0.875rem">Loading…</div>
      <table v-else style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">When</th>
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">Rule</th>
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">Engine</th>
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">Result</th>
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in entries"
            :key="entry.id"
            style="border-bottom:1px solid #1e1e1e"
          >
            <td style="padding:10px 16px;color:#71717a;font-size:0.8rem;white-space:nowrap">{{ formatTime(entry.occurredAt) }}</td>
            <td style="padding:10px 16px;color:#e5e5e5;font-size:0.875rem">{{ payload(entry).ruleName }}</td>
            <td style="padding:10px 16px">
              <span :style="engineBadge(payload(entry).engine)" style="border-radius:5px;padding:2px 7px;font-size:0.72rem;font-weight:500">
                {{ payload(entry).engine }}
              </span>
            </td>
            <td style="padding:10px 16px">
              <span :style="resultBadge(payload(entry).result)" style="border-radius:5px;padding:2px 7px;font-size:0.72rem;font-weight:600">
                {{ payload(entry).result }}
              </span>
            </td>
            <td style="padding:10px 16px;color:#71717a;font-size:0.78rem;font-family:monospace">
              {{ detail(payload(entry)) }}
            </td>
          </tr>
          <tr v-if="entries.length === 0">
            <td colspan="5" style="padding:40px;text-align:center;color:#71717a;font-size:0.875rem">
              No rule execution events yet. Events are recorded when reactive rules fire, validation rules fail, or policy rules deny an action.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' });

const { api } = useApi();

interface LogEntry {
  id: string;
  payload: unknown;
  occurredAt: string;
}

interface EntryPayload {
  ruleId?: string;
  ruleName?: string;
  engine?: string;
  result?: string;
  trigger?: string;
  entity?: string;
  action?: string;
  errorCode?: string;
  errorMessage?: string;
  reason?: string;
  actionCount?: number;
  durationMs?: number;
}

const { data: entries, pending, refresh } = await useAsyncData(
  'rule-log',
  () => api<LogEntry[]>('/api/v1/audit-log/rule-log'),
  { server: false, default: () => [] as LogEntry[] },
);

function payload(entry: LogEntry): EntryPayload {
  return (entry.payload ?? {}) as EntryPayload;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'medium' });
}

function engineBadge(engine?: string) {
  const map: Record<string, string> = {
    reactive: 'background:rgba(59,130,246,0.12);color:#60a5fa',
    validation: 'background:rgba(234,179,8,0.12);color:#facc15',
    policy: 'background:rgba(239,68,68,0.12);color:#f87171',
    decision: 'background:rgba(168,85,247,0.12);color:#c084fc',
  };
  return map[engine ?? ''] ?? 'background:rgba(113,113,122,0.12);color:#71717a';
}

function resultBadge(result?: string) {
  const map: Record<string, string> = {
    fired: 'background:rgba(34,197,94,0.12);color:#4ade80',
    failed: 'background:rgba(239,68,68,0.12);color:#f87171',
    denied: 'background:rgba(239,68,68,0.12);color:#f87171',
    passed: 'background:rgba(34,197,94,0.12);color:#4ade80',
  };
  return map[result ?? ''] ?? 'background:rgba(113,113,122,0.12);color:#71717a';
}

function detail(p: EntryPayload): string {
  if (p.errorMessage) return p.errorMessage;
  if (p.reason) return p.reason;
  if (p.trigger) return `trigger: ${p.trigger}${p.actionCount != null ? ` · ${p.actionCount} actions` : ''}`;
  if (p.entity) return `entity: ${p.entity}${p.action ? ` · ${p.action}` : ''}`;
  return '—';
}
</script>
