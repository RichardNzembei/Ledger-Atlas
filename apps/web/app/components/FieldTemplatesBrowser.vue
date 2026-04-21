<template>
  <UModal v-model="open" :ui="{ width: 'sm:max-w-5xl' }">
    <div style="background:#111;border-radius:12px;overflow:hidden;max-height:88vh;display:flex;flex-direction:column">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #222;flex-shrink:0">
        <div>
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#fff">Field Templates</h2>
          <p style="margin:2px 0 0;font-size:0.75rem;color:#52525b">{{ verticals.length }} industry verticals — install pre-built field sets in one click</p>
        </div>
        <button style="background:transparent;border:none;color:#52525b;cursor:pointer;padding:4px" @click="open = false">
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- Body: sidebar + main -->
      <div style="display:flex;flex:1;overflow:hidden">
        <!-- Vertical sidebar -->
        <div style="width:200px;flex-shrink:0;border-right:1px solid #1e1e1e;overflow-y:auto;padding:12px 8px;display:flex;flex-direction:column;gap:2px">
          <button
            v-for="v in verticals"
            :key="v.id"
            style="border:none;border-radius:7px;padding:8px 10px;font-size:0.8rem;cursor:pointer;text-align:left;width:100%;transition:all 0.1s;line-height:1.3"
            :style="activeVertical?.id === v.id
              ? 'background:#f97316;color:#fff;font-weight:600'
              : 'background:transparent;color:#a3a3a3;font-weight:500'"
            @click="activeVertical = v"
          >
            {{ v.name }}
          </button>
        </div>

        <!-- Detail panel -->
        <div style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px">
          <div v-if="!activeVertical" style="display:flex;align-items:center;justify-content:center;height:100%;color:#3f3f46;font-size:0.875rem">
            Select a vertical to see field templates
          </div>

          <template v-else>
            <!-- Vertical description -->
            <div>
              <h3 style="margin:0 0 4px;font-size:0.9rem;font-weight:600;color:#fff">{{ activeVertical.name }}</h3>
              <p style="margin:0;font-size:0.8rem;color:#71717a">{{ activeVertical.description }}</p>
            </div>

            <!-- Entity sections -->
            <div
              v-for="section in activeVertical.entities"
              :key="`${activeVertical.id}_${section.entity}`"
              style="background:#1a1a1a;border:1px solid #222;border-radius:10px;overflow:hidden"
            >
              <!-- Section header -->
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #1e1e1e">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:0.8rem;font-weight:600;color:#e5e5e5">{{ section.label }}</span>
                  <span style="background:rgba(249,115,22,0.1);color:#f97316;border-radius:4px;padding:1px 7px;font-size:0.7rem;font-weight:500">
                    {{ section.entity }}
                  </span>
                  <span style="color:#52525b;font-size:0.75rem">{{ section.fields.length }} fields</span>
                </div>

                <!-- Install button / progress / done -->
                <div>
                  <div v-if="sectionState(activeVertical.id, section.entity) === 'done'" style="display:flex;align-items:center;gap:6px;color:#4ade80;font-size:0.75rem;font-weight:500">
                    <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                    Installed
                  </div>
                  <div v-else-if="sectionState(activeVertical.id, section.entity) === 'installing'" style="color:#f97316;font-size:0.75rem;font-weight:500">
                    Installing {{ installing.get(sectionKey(activeVertical.id, section.entity))?.done }}/{{ section.fields.length }}…
                  </div>
                  <div v-else-if="sectionState(activeVertical.id, section.entity) === 'error'" style="display:flex;align-items:center;gap:6px">
                    <span style="color:#f87171;font-size:0.75rem">{{ installing.get(sectionKey(activeVertical.id, section.entity))?.error }}</span>
                    <button
                      style="background:rgba(249,115,22,0.1);color:#f97316;border:none;border-radius:6px;padding:4px 10px;font-size:0.75rem;cursor:pointer;font-weight:500"
                      @click="installSection(activeVertical, section)"
                    >Retry</button>
                  </div>
                  <button
                    v-else
                    style="background:#f97316;color:#fff;border:none;border-radius:7px;padding:5px 12px;font-size:0.775rem;font-weight:500;cursor:pointer;transition:opacity 0.1s"
                    @mouseenter="($event.currentTarget as HTMLElement).style.opacity='0.85'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
                    @click="installSection(activeVertical, section)"
                  >
                    Install {{ section.fields.length }} fields
                  </button>
                </div>
              </div>

              <!-- Fields preview table -->
              <table style="width:100%;border-collapse:collapse">
                <tbody>
                  <tr
                    v-for="field in section.fields"
                    :key="field.fieldKey"
                    style="border-bottom:1px solid #1a1a1a"
                  >
                    <td style="padding:7px 16px;width:36px">
                      <span v-if="fieldInstalled(activeVertical.id, section.entity, field.fieldKey)" style="color:#4ade80;font-size:0.8rem">✓</span>
                      <span v-else style="color:#2a2a2a;font-size:0.8rem">·</span>
                    </td>
                    <td style="padding:7px 8px;color:#e5e5e5;font-size:0.8rem;font-weight:500;white-space:nowrap">{{ field.label }}</td>
                    <td style="padding:7px 8px">
                      <code style="background:#111;border:1px solid #222;border-radius:4px;padding:1px 6px;font-size:0.7rem;color:#71717a;font-family:monospace">{{ field.fieldKey }}</code>
                    </td>
                    <td style="padding:7px 8px">
                      <span :style="dataTypeBadge(field.dataType)" style="border-radius:4px;padding:1px 7px;font-size:0.7rem;font-weight:500">{{ field.dataType }}</span>
                    </td>
                    <td style="padding:7px 8px;color:#52525b;font-size:0.75rem">{{ field.section }}</td>
                    <td style="padding:7px 16px 7px 8px;text-align:right">
                      <span v-if="field.isRequired" style="color:#f97316;font-size:0.7rem;font-weight:600">req</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import type { VerticalTemplate, VerticalEntitySection } from '~/composables/useFieldTemplates';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; installed: [] }>();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const { api } = useApi();
const { verticals } = useFieldTemplates();
const activeVertical = ref<VerticalTemplate | null>(verticals.value[0] ?? null);

interface SectionProgress {
  done: number;
  installedKeys: Set<string>;
  complete: boolean;
  error?: string;
}

const installing = ref(new Map<string, SectionProgress>());

function sectionKey(verticalId: string, entity: string) {
  return `${verticalId}__${entity}`;
}

function sectionState(verticalId: string, entity: string): 'idle' | 'installing' | 'done' | 'error' {
  const s = installing.value.get(sectionKey(verticalId, entity));
  if (!s) return 'idle';
  if (s.complete) return 'done';
  if (s.error) return 'error';
  return 'installing';
}

function fieldInstalled(verticalId: string, entity: string, fieldKey: string): boolean {
  return installing.value.get(sectionKey(verticalId, entity))?.installedKeys.has(fieldKey) ?? false;
}

async function installSection(vertical: VerticalTemplate, section: VerticalEntitySection) {
  const key = sectionKey(vertical.id, section.entity);
  const progress: SectionProgress = { done: 0, installedKeys: new Set(), complete: false };
  installing.value = new Map(installing.value).set(key, progress);

  for (const field of section.fields) {
    try {
      const body: Record<string, unknown> = {
        fieldKey: field.fieldKey,
        label: field.label,
        dataType: field.dataType,
        isRequired: field.isRequired,
        section: field.section,
        displayOrder: field.displayOrder,
        entityType: section.entity,
        config: field.config ?? {},
      };
      await api('/api/v1/metadata/fields', { method: 'POST', body });
      progress.done++;
      progress.installedKeys = new Set([...progress.installedKeys, field.fieldKey]);
      installing.value = new Map(installing.value).set(key, { ...progress });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Install failed';
      installing.value = new Map(installing.value).set(key, { ...progress, error: msg });
      return;
    }
  }

  installing.value = new Map(installing.value).set(key, { ...progress, complete: true });
  emit('installed');
}

function dataTypeBadge(dt: string): string {
  const map: Record<string, string> = {
    string: 'background:rgba(59,130,246,0.12);color:#60a5fa',
    text: 'background:rgba(59,130,246,0.08);color:#93c5fd',
    number: 'background:rgba(34,197,94,0.12);color:#4ade80',
    decimal: 'background:rgba(34,197,94,0.08);color:#86efac',
    boolean: 'background:rgba(168,85,247,0.12);color:#c084fc',
    date: 'background:rgba(234,179,8,0.12);color:#facc15',
    datetime: 'background:rgba(234,179,8,0.08);color:#fde047',
    enum: 'background:rgba(249,115,22,0.12);color:#f97316',
    reference: 'background:rgba(239,68,68,0.12);color:#f87171',
    json: 'background:rgba(113,113,122,0.15);color:#a1a1aa',
  };
  return map[dt] ?? 'background:rgba(113,113,122,0.15);color:#71717a';
}
</script>
