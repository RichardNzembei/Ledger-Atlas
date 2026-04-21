<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1 style="font-size:1.25rem;font-weight:700;color:#fff;margin:0">Audit Log</h1>
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
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">Action</th>
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">What</th>
            <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#52525b;border-bottom:1px solid #1e1e1e">By</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in entries"
            :key="entry.id"
            style="border-bottom:1px solid #1e1e1e"
          >
            <td style="padding:10px 16px;color:#71717a;font-size:0.8rem;white-space:nowrap">{{ formatTime(entry.occurredAt) }}</td>
            <td style="padding:10px 16px">
              <span :style="actionBadge(entry.eventType)" style="border-radius:6px;padding:2px 8px;font-size:0.72rem;font-weight:600">
                {{ entry.eventType }}
              </span>
            </td>
            <td style="padding:10px 16px;font-size:0.875rem">
              <code style="color:#e5e5e5;font-family:monospace;font-size:0.8rem">{{ (entry.payload as Record<string,unknown>)['entityName'] }}</code>
            </td>
            <td style="padding:10px 16px;color:#71717a;font-size:0.8rem;font-family:monospace">
              {{ truncate((entry.payload as Record<string,unknown>)['userId'] as string) }}
            </td>
          </tr>
          <tr v-if="entries.length === 0">
            <td colspan="4" style="padding:40px;text-align:center;color:#71717a;font-size:0.875rem">
              No audit events yet. Actions on fields, rules, and settings will appear here.
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

interface AuditEntry {
  id: string;
  eventType: string;
  payload: unknown;
  occurredAt: string;
}

const { data: entries, pending, refresh } = await useAsyncData(
  'audit-log',
  () => api<AuditEntry[]>('/api/v1/audit-log'),
  { server: false, default: () => [] as AuditEntry[] },
);

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'medium' });
}

function truncate(id?: string) {
  if (!id) return '—';
  return id.slice(0, 8) + '…';
}

function actionBadge(eventType: string) {
  if (eventType.endsWith('.created')) return 'background:rgba(34,197,94,0.12);color:#4ade80';
  if (eventType.endsWith('.activated')) return 'background:rgba(34,197,94,0.12);color:#4ade80';
  if (eventType.endsWith('.deactivated')) return 'background:rgba(113,113,122,0.12);color:#71717a';
  if (eventType.endsWith('.updated')) return 'background:rgba(59,130,246,0.12);color:#60a5fa';
  if (eventType.endsWith('.upserted')) return 'background:rgba(249,115,22,0.12);color:#f97316';
  return 'background:rgba(113,113,122,0.12);color:#a3a3a3';
}
</script>
