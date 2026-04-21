<template>
  <UModal v-model="open" :ui="{ width: 'sm:max-w-4xl' }">
    <div style="background:#111;border-radius:12px;overflow:hidden;max-height:85vh;display:flex;flex-direction:column">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #222;flex-shrink:0">
        <div>
          <h2 style="margin:0;font-size:1rem;font-weight:600;color:#fff">Rule Templates</h2>
          <p style="margin:2px 0 0;font-size:0.75rem;color:#52525b">{{ templates.length }} production-ready recipes — click Use to pre-fill the rule form</p>
        </div>
        <button style="background:transparent;border:none;color:#52525b;cursor:pointer;padding:4px" @click="open = false">
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- Category tabs -->
      <div style="display:flex;gap:2px;padding:12px 20px 0;flex-shrink:0;overflow-x:auto;scrollbar-width:none">
        <button
          v-for="cat in categories"
          :key="cat"
          style="border:none;border-radius:7px 7px 0 0;padding:6px 12px;font-size:0.75rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all 0.1s"
          :style="activeCategory === cat
            ? 'background:#1a1a1a;color:#fff;border-bottom:2px solid #f97316'
            : 'background:transparent;color:#71717a'"
          @click="activeCategory = cat"
        >
          {{ cat }}
          <span style="margin-left:4px;opacity:0.6;font-weight:400">{{ templatesByCategory[cat]?.length }}</span>
        </button>
      </div>

      <!-- Template grid -->
      <div style="overflow-y:auto;padding:0 20px 20px;background:#1a1a1a;flex:1">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:16px">
          <div
            v-for="tmpl in templatesByCategory[activeCategory]"
            :key="tmpl.id"
            style="background:#111;border:1px solid #222;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px;transition:border-color 0.1s"
            @mouseenter="($event.currentTarget as HTMLElement).style.borderColor='#2a2a2a'"
            @mouseleave="($event.currentTarget as HTMLElement).style.borderColor='#222'"
          >
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
              <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span style="font-size:0.65rem;color:#52525b;font-weight:600">#{{ tmpl.id }}</span>
                  <span :style="engineStyle(tmpl.engine)" style="border-radius:4px;padding:1px 7px;font-size:0.7rem;font-weight:600">{{ tmpl.engine }}</span>
                </div>
                <p style="margin:0;font-size:0.8rem;font-weight:600;color:#e5e5e5;line-height:1.3">{{ tmpl.name }}</p>
              </div>
            </div>

            <p style="margin:0;font-size:0.75rem;color:#71717a;line-height:1.5">{{ tmpl.scenario }}</p>

            <div v-if="tmpl.dependencies?.length" style="display:flex;flex-direction:column;gap:3px">
              <p style="margin:0;font-size:0.65rem;font-weight:600;color:#3f3f46;text-transform:uppercase;letter-spacing:0.05em">Requires</p>
              <div style="display:flex;flex-direction:column;gap:2px">
                <span
                  v-for="dep in tmpl.dependencies"
                  :key="dep"
                  style="font-size:0.7rem;color:#52525b;font-family:monospace"
                >· {{ dep }}</span>
              </div>
            </div>

            <button
              style="margin-top:auto;width:100%;background:#f97316;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:0.8rem;font-weight:500;cursor:pointer;transition:opacity 0.1s"
              @mouseenter="($event.currentTarget as HTMLElement).style.opacity='0.88'"
              @mouseleave="($event.currentTarget as HTMLElement).style.opacity='1'"
              @click="useTemplate(tmpl)"
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import type { RuleTemplate } from '~/composables/useRuleTemplates';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; use: [RuleTemplate] }>();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const { categories, templatesByCategory, templates } = useRuleTemplates();
const activeCategory = ref(categories.value[0] ?? '');

function engineStyle(engine: string) {
  const map: Record<string, string> = {
    reactive: 'background:rgba(59,130,246,0.15);color:#60a5fa',
    decision: 'background:rgba(168,85,247,0.15);color:#c084fc',
    validation: 'background:rgba(234,179,8,0.15);color:#facc15',
    policy: 'background:rgba(239,68,68,0.15);color:#f87171',
  };
  return map[engine] ?? 'background:rgba(113,113,122,0.15);color:#71717a';
}

function useTemplate(tmpl: RuleTemplate) {
  emit('use', tmpl);
  open.value = false;
}
</script>
