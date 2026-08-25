<script setup lang="ts">
import { computed, onMounted } from 'vue';

/**
 * The list of placeholders an author may insert, with a button per field.
 *
 * Why this exists: an unknown placeholder is not an error anywhere in the
 * pipeline — the backend resolves it to an empty string — so a template with
 * {frist_name} ships an e-mail with a hole in it and nothing reports the
 * mistake. Clicking a field is how an author stops typing them from memory.
 *
 * Emits the placeholder text rather than writing it: only the editor that
 * owns the caret knows where "insert here" is, and that differs between the
 * rich-text editor and a plain textarea.
 */
const emit = defineEmits<{ insert: [placeholder: string] }>();

const props = defineProps<{
  // Placeholders currently in the body that resolve to nothing — highlighted
  // so the author sees which of their own words the engine does not know.
  unknown?: string[];
}>();

const { t } = useI18n();
const { fieldCatalog, loadFieldCatalog } = useTemplates();

onMounted(() => loadFieldCatalog());

const groups = computed(() => fieldCatalog.value?.groups ?? []);
</script>

<template>
  <div class="field-picker">
    <div class="text-body-2 font-weight-medium mb-1">{{ t('pages.templates.fieldsTitle') }}</div>
    <div class="text-caption text-medium-emphasis mb-3">{{ t('pages.templates.fieldsHint') }}</div>

    <v-alert
      v-if="props.unknown?.length"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="text-caption">{{ t('pages.templates.unknownPlaceholders') }}</div>
      <div class="mt-1">
        <code v-for="name in props.unknown" :key="name" class="unknown-chip">{{ '{' + name + '}' }}</code>
      </div>
    </v-alert>

    <div v-for="group in groups" :key="group.group" class="mb-4">
      <div class="text-caption font-weight-medium text-uppercase text-medium-emphasis">{{ group.label }}</div>
      <div class="text-caption text-medium-emphasis mb-2">{{ group.description }}</div>
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="field in group.fields"
          :key="field.key"
          size="small"
          variant="outlined"
          class="field-chip"
          @click="emit('insert', field.placeholder)"
        >
          {{ field.label }}
        </v-chip>
      </div>
    </div>

    <v-divider class="my-3" />

    <div class="text-caption text-medium-emphasis">
      <!-- The two families with no catalogue to pick from: prompt values are
           supplied per send by the calling code, and an include points at
           another template by id. -->
      <div class="mb-1"><code>{prompt:name}</code> — {{ t('pages.templates.promptHint') }}</div>
      <div class="mb-1"><code>{field!}</code> — {{ t('pages.templates.strictHint') }}</div>
      <div><code>{@template-id}</code> — {{ t('pages.templates.includeHint') }}</div>
    </div>
  </div>
</template>

<style scoped>
.field-chip {
  cursor: pointer;
}

.unknown-chip {
  display: inline-block;
  margin-right: 4px;
  font-size: 11px;
}
</style>
