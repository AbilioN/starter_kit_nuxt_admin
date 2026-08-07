<script setup lang="ts">
import { computed } from 'vue';
import type { TemplateEntry } from '~/types/api';

const body = defineModel<string>({ required: true });

const { t } = useI18n();

const REQUIRED_FIELDS: (keyof TemplateEntry)[] = ['x', 'y', 'text', 'page'];

// Validated live so the author gets feedback as they type, without ever
// touching `body` itself on a parse failure — this mirrors the backend's
// own contract (TemplateEntry::fromArray throws on a missing required
// field) so what validates here is what the render pipeline will accept.
const validation = computed<{ ok: true; count: number } | { ok: false; message: string }>(() => {
  const raw = body.value?.trim();
  if (!raw) return { ok: true, count: 0 };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Invalid JSON' };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, message: t('pages.templates.entriesMustBeArray') };
  }

  for (let i = 0; i < parsed.length; i++) {
    const entry = parsed[i];
    if (typeof entry !== 'object' || entry === null) {
      return { ok: false, message: t('pages.templates.entryMustBeObject', { index: i }) };
    }
    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) {
        return { ok: false, message: t('pages.templates.entryMissingField', { index: i, field }) };
      }
    }
  }

  return { ok: true, count: parsed.length };
});

const formatJson = () => {
  if (!validation.value.ok) return;
  const raw = body.value?.trim();
  if (!raw) return;
  body.value = JSON.stringify(JSON.parse(raw), null, 2);
};

const placeholderText = '[\n  { "x": 20, "y": 30, "text": "{first_name}", "page": 1 }\n]';

const insertExampleEntry = () => {
  let entries: TemplateEntry[] = [];
  const raw = body.value?.trim();
  if (raw && validation.value.ok) {
    entries = JSON.parse(raw);
  }
  entries.push({ x: 20, y: 30, text: '{first_name}', page: 1 });
  body.value = JSON.stringify(entries, null, 2);
};
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="d-flex ga-2">
        <v-btn size="small" variant="outlined" prepend-icon="mdi-code-braces" :disabled="!validation.ok" @click="formatJson">
          {{ t('pages.templates.formatJson') }}
        </v-btn>
        <v-btn size="small" variant="outlined" prepend-icon="mdi-plus" @click="insertExampleEntry">
          {{ t('pages.templates.insertExampleEntry') }}
        </v-btn>
      </div>
      <v-chip v-if="validation.ok" color="success" variant="tonal" size="small">
        {{ t('pages.templates.entriesValid', { count: validation.count }) }}
      </v-chip>
      <v-chip v-else color="error" variant="tonal" size="small">
        {{ t('pages.templates.entriesInvalid') }}
      </v-chip>
    </div>

    <v-textarea
      v-model="body"
      variant="outlined"
      rows="14"
      class="entries-json"
      :placeholder="placeholderText"
    />

    <v-alert v-if="!validation.ok" type="error" variant="tonal" density="compact" class="mt-2">
      {{ validation.message }}
    </v-alert>

    <div class="text-caption text-medium-emphasis mt-2">
      {{ t('pages.templates.entriesHint') }}
    </div>
  </div>
</template>

<style scoped>
.entries-json :deep(textarea) {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 13px;
}
</style>
