<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import PdfEntriesJsonEditor from '~/components/Templates/PdfEntriesJsonEditor.vue';
import PdfEntriesCanvas from '~/components/Templates/PdfEntriesCanvas.vue';
import type { TemplateEntry } from '~/types/api';

const props = defineProps<{
  templateId: string;
}>();

const body = defineModel<string>({ required: true });

const { t } = useI18n();
const notification = useNotification();

type Mode = 'standard' | 'expert';
const mode = ref<Mode>('standard');
const entries = ref<TemplateEntry[]>([]);

const REQUIRED_FIELDS: (keyof TemplateEntry)[] = ['x', 'y', 'text', 'page'];

const parseEntries = (raw: string): TemplateEntry[] | null => {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return null;
    for (const entry of parsed) {
      if (typeof entry !== 'object' || entry === null) return null;
      for (const field of REQUIRED_FIELDS) {
        if (!(field in entry)) return null;
      }
    }
    return parsed as TemplateEntry[];
  } catch {
    return null;
  }
};

// Mode switching converts, it never just reveals a different view of stale
// state: Standard -> Expert always succeeds (serialization can't fail).
// Expert -> Standard can fail on bad JSON — when it does, the switch is
// refused and the author's text is left untouched, still in Expert, rather
// than silently discarding what they typed.
const switchToExpert = () => {
  body.value = JSON.stringify(entries.value, null, 2);
  mode.value = 'expert';
};

const switchToStandard = () => {
  const parsed = parseEntries(body.value ?? '');
  if (parsed === null) {
    notification.error(t('pages.templates.cannotSwitchToStandard'));
    return;
  }
  entries.value = parsed;
  mode.value = 'standard';
};

// entries is the source of truth while in Standard mode (the canvas drags
// mutate it directly) — keep body's text representation up to date so a
// save triggered from the parent form always reflects the latest drag.
watch(entries, (value) => {
  if (mode.value === 'standard') body.value = JSON.stringify(value);
}, { deep: true });

const adoptBody = () => {
  const parsed = parseEntries(body.value ?? '');
  if (parsed === null) {
    // Existing body isn't valid entries JSON — start in Expert so the
    // author can see and fix it, rather than silently discarding it.
    mode.value = 'expert';
  } else {
    entries.value = parsed;
  }
};

onMounted(adoptBody);

// The body arrives AFTER this mounts: the parent form is created with empty
// values and filled in when its fetch resolves, so reading it once on mount
// saw '' and left the canvas with no entries at all. Guarded against the
// echo of our own watch below by comparing the serialized form.
watch(body, (value) => {
  if (mode.value !== 'standard') return;
  if (value === JSON.stringify(entries.value)) return;
  adoptBody();
});
</script>

<template>
  <div>
    <v-btn-toggle :model-value="mode" mandatory density="compact" variant="outlined" class="mb-3">
      <v-btn value="standard" size="small" @click="mode !== 'standard' && switchToStandard()">
        {{ t('pages.templates.modeStandard') }}
      </v-btn>
      <v-btn value="expert" size="small" @click="mode !== 'expert' && switchToExpert()">
        {{ t('pages.templates.modeExpert') }}
      </v-btn>
    </v-btn-toggle>

    <PdfEntriesCanvas v-if="mode === 'standard'" v-model="entries" :template-id="templateId" />
    <PdfEntriesJsonEditor v-else v-model="body" />
  </div>
</template>
