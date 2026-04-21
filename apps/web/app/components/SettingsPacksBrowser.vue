<template>
  <UModal v-model="open" :ui="{ width: 'sm:max-w-4xl' }">
    <div style="background:#111;border-radius:12px;overflow:hidden;max-height:88vh;display:flex;flex-direction:column">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #222;flex-shrink:0">
        <div>
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#fff">Settings Starter Packs</h2>
          <p style="margin:2px 0 0;font-size:0.75rem;color:#52525b">{{ packs.length }} pre-built bundles — install all settings for your vertical in one click</p>
        </div>
        <button style="background:transparent;border:none;color:#52525b;cursor:pointer;padding:4px" @click="open = false">
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- Install order hint -->
      <div style="padding:10px 20px;border-bottom:1px solid #1e1e1e;background:#0d0d0d;flex-shrink:0;display:flex;align-items:center;gap:8px">
        <span style="font-size:0.7rem;color:#52525b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Recommended order:</span>
        <span style="font-size:0.75rem;color:#71717a">
          <span style="color:#f97316">① Global Baseline</span>
          <span style="color:#3f3f46"> → </span>
          <span style="color:#60a5fa">② Size pack</span>
          <span style="color:#3f3f46"> → </span>
          <span style="color:#c084fc">③ Vertical pack</span>
          <span style="color:#3f3f46"> → </span>
          <span style="color:#71717a">④ Tenant-specific values</span>
        </span>
      </div>

      <!-- Content: category tabs + pack grid -->
      <div style="display:flex;flex-direction:column;flex:1;overflow:hidden">
        <!-- Category tabs -->
        <div style="display:flex;gap:2px;padding:12px 20px 0;flex-shrink:0">
          <button
            v-for="cat in categoryTabs"
            :key="cat.id"
            style="border:none;border-radius:7px 7px 0 0;padding:6px 14px;font-size:0.775rem;font-weight:500;cursor:pointer;transition:all 0.1s;white-space:nowrap"
            :style="activeCategory === cat.id
              ? 'background:#1a1a1a;color:#fff;border-bottom:2px solid #f97316'
              : 'background:transparent;color:#71717a'"
            @click="activeCategory = cat.id"
          >
            {{ cat.label }}
            <span style="margin-left:4px;opacity:0.5;font-weight:400">{{ byCategory[cat.id as PackCategory]?.length }}</span>
          </button>
        </div>

        <!-- Pack grid -->
        <div style="overflow-y:auto;padding:0 20px 20px;background:#1a1a1a;flex:1">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:16px">
            <div
              v-for="pack in byCategory[activeCategory as PackCategory]"
              :key="pack.id"
              style="background:#111;border:1px solid #222;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px;transition:border-color 0.1s"
              @mouseenter="($event.currentTarget as HTMLElement).style.borderColor='#2a2a2a'"
              @mouseleave="($event.currentTarget as HTMLElement).style.borderColor='#222'"
            >
              <!-- Pack header -->
              <div style="display:flex;flex-direction:column;gap:4px">
                <div style="display:flex;align-items:center;gap:6px">
                  <span :style="categoryBadge(pack.category)" style="border-radius:4px;padding:1px 7px;font-size:0.7rem;font-weight:600">
                    {{ pack.category }}
                  </span>
                  <span style="color:#52525b;font-size:0.75rem">{{ pack.settings.length }} settings</span>
                </div>
                <p style="margin:0;font-size:0.85rem;font-weight:600;color:#e5e5e5">{{ pack.name }}</p>
              </div>

              <p style="margin:0;font-size:0.75rem;color:#71717a;line-height:1.5;flex:1">{{ pack.description }}</p>

              <!-- Fill-in notice for packs with empty strings -->
              <div v-if="hasFillIns(pack)" style="display:flex;gap:6px;padding:6px 8px;background:rgba(234,179,8,0.07);border:1px solid rgba(234,179,8,0.15);border-radius:6px">
                <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" style="color:#facc15;flex-shrink:0;margin-top:1px" />
                <p style="margin:0;font-size:0.7rem;color:#a16207;line-height:1.4">Some settings need manual values after install (e.g. KRA PIN, license number).</p>
              </div>

              <!-- Action -->
              <div>
                <div v-if="packState(pack.id) === 'done'" style="display:flex;align-items:center;gap:6px;color:#4ade80;font-size:0.775rem;font-weight:500">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                  Installed {{ installing.get(pack.id)?.done }} settings
                </div>
                <div v-else-if="packState(pack.id) === 'installing'" style="display:flex;flex-direction:column;gap:6px">
                  <div style="height:3px;background:#1e1e1e;border-radius:2px;overflow:hidden">
                    <div
                      style="height:100%;background:#f97316;border-radius:2px;transition:width 0.2s"
                      :style="`width:${Math.round(((installing.get(pack.id)?.done ?? 0) / pack.settings.length) * 100)}%`"
                    />
                  </div>
                  <span style="color:#f97316;font-size:0.75rem;font-weight:500">
                    Installing {{ installing.get(pack.id)?.done }}/{{ pack.settings.length }}…
                  </span>
                </div>
                <div v-else-if="packState(pack.id) === 'error'" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span style="color:#f87171;font-size:0.75rem;flex:1">{{ installing.get(pack.id)?.error }}</span>
                  <button
                    style="background:rgba(249,115,22,0.1);color:#f97316;border:none;border-radius:6px;padding:4px 10px;font-size:0.75rem;cursor:pointer;font-weight:500"
                    @click="installPack(pack)"
                  >Retry</button>
                </div>
                <button
                  v-else
                  style="width:100%;background:#f97316;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:0.8rem;font-weight:500;cursor:pointer;transition:opacity 0.1s"
                  @mouseenter="($event.currentTarget as HTMLElement).style.opacity='0.85'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
                  @click="installPack(pack)"
                >
                  Install {{ pack.settings.length }} settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import type { SettingsPack, PackCategory } from '~/composables/useSettingsPacks';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; installed: [] }>();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const { api } = useApi();
const { packs, byCategory } = useSettingsPacks();

const categoryTabs = [
  { id: 'baseline', label: 'Baseline' },
  { id: 'size', label: 'Size' },
  { id: 'vertical', label: 'Vertical' },
];

const activeCategory = ref<string>('baseline');

interface PackProgress {
  done: number;
  complete: boolean;
  error?: string;
}

const installing = ref(new Map<string, PackProgress>());

function packState(id: string): 'idle' | 'installing' | 'done' | 'error' {
  const s = installing.value.get(id);
  if (!s) return 'idle';
  if (s.complete) return 'done';
  if (s.error) return 'error';
  return 'installing';
}

function hasFillIns(pack: SettingsPack): boolean {
  return pack.settings.some((s) => s.rawValue === '""');
}

async function installPack(pack: SettingsPack) {
  const progress: PackProgress = { done: 0, complete: false };
  installing.value = new Map(installing.value).set(pack.id, progress);

  for (const setting of pack.settings) {
    let value: unknown;
    try {
      value = JSON.parse(setting.rawValue);
    } catch {
      installing.value = new Map(installing.value).set(pack.id, { ...progress, error: `Bad JSON for key ${setting.key}` });
      return;
    }
    try {
      await api('/api/v1/settings', {
        method: 'POST',
        body: { scopeType: 'tenant', key: setting.key, value },
      });
      progress.done++;
      installing.value = new Map(installing.value).set(pack.id, { ...progress });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Install failed';
      installing.value = new Map(installing.value).set(pack.id, { ...progress, error: msg });
      return;
    }
  }

  installing.value = new Map(installing.value).set(pack.id, { ...progress, complete: true });
  emit('installed');
}

function categoryBadge(cat: PackCategory): string {
  const map: Record<PackCategory, string> = {
    baseline: 'background:rgba(249,115,22,0.15);color:#f97316',
    size: 'background:rgba(59,130,246,0.15);color:#60a5fa',
    vertical: 'background:rgba(168,85,247,0.15);color:#c084fc',
  };
  return map[cat];
}
</script>
