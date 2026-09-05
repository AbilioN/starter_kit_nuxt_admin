<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AgentDocument, DocumentAudience, SaveAgentDocumentPayload } from '~/types/agent-documents';

const props = defineProps<{
  modelValue: boolean;
  document: AgentDocument | null;
  saving: boolean;
  save: (payload: SaveAgentDocumentPayload, id?: string) => Promise<AgentDocument | null>;
  /**
   * Shown INSIDE the dialog. The page has its own alert, but it sits above the
   * fold behind this dialog's scrim — so a rejected upload ("no text could be
   * read from it; a scanned document needs OCR first") reached nobody.
   */
  error?: string | null;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();

const title = ref('');
const description = ref('');
const audience = ref<DocumentAudience>('internal');
const isActive = ref(true);
const content = ref('');
const file = ref<File[] | File | null>(null);

const isEdit = computed(() => props.document !== null);

const reset = () => {
  title.value = props.document?.title ?? '';
  description.value = props.document?.description ?? '';
  audience.value = props.document?.audience ?? 'internal';
  isActive.value = props.document?.is_active ?? true;
  content.value = props.document?.content ?? '';
  file.value = null;
};

// `immediate` matters: a watch without it does not fire when the dialog is
// already open at mount, which shipped once as a form rendering before its
// own reset had run.
watch(() => [props.modelValue, props.document], reset, { immediate: true });

const chosenFile = computed<File | null>(() => {
  const value = file.value;
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
});

/**
 * A new document needs one of the two; an edit needs neither, because leaving
 * both blank keeps whatever text it already has.
 */
const canSubmit = computed(
  () => title.value.trim() !== '' && (isEdit.value || content.value.trim() !== '' || chosenFile.value !== null),
);

const submit = async () => {
  if (!canSubmit.value) return;

  const saved = await props.save(
    {
      title: title.value.trim(),
      description: description.value.trim() || null,
      audience: audience.value,
      is_active: isActive.value,
      // Only send text when there is no file: the backend prefers the file and
      // sending both would quietly discard whichever it did not pick.
      content: chosenFile.value ? null : content.value,
      file: chosenFile.value,
    },
    props.document?.id,
  );

  // Null means the save failed. The dialog stays open with what was typed and
  // renders the server's own message above the form — which for a scanned PDF
  // says exactly that, and used to be hidden behind this dialog's own scrim.
  if (saved) emit('saved');
};

const close = () => emit('update:modelValue', false);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-subtitle-1">
        {{ isEdit ? t('assistant.editDocument') : t('assistant.addDocument') }}
      </v-card-title>

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>

        <v-text-field
          v-model="title"
          :disabled="readonly"
          :label="t('assistant.documentTitle')"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          hide-details="auto"
        />

        <v-text-field
          v-model="description"
          :disabled="readonly"
          :label="t('assistant.documentDescription')"
          :hint="t('assistant.documentDescriptionHint')"
          persistent-hint
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />

        <v-select
          v-model="audience"
          :disabled="readonly"
          :items="[
            { title: t('assistant.audience_internal'), value: 'internal', subtitle: t('assistant.audienceInternalHelp') },
            { title: t('assistant.audience_published'), value: 'published', subtitle: t('assistant.audiencePublishedHelp') },
          ]"
          :label="t('assistant.audience')"
          item-props
          variant="outlined"
          density="comfortable"
          class="mb-4"
          hide-details="auto"
        />

        <v-file-input
          v-model="file"
          :disabled="readonly"
          :label="t('assistant.documentFile')"
          :hint="t('assistant.documentFileHint')"
          persistent-hint
          accept=".pdf,.txt,.md"
          prepend-icon=""
          prepend-inner-icon="mdi-paperclip"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />

        <v-textarea
          v-model="content"
          :label="t('assistant.documentContent')"
          :hint="isEdit ? t('assistant.documentContentEditHint') : t('assistant.documentContentHint')"
          persistent-hint
          :disabled="readonly || chosenFile !== null"
          rows="8"
          variant="outlined"
        />

        <v-switch
          v-model="isActive"
          :disabled="readonly"
          :label="t('assistant.documentActive')"
          color="primary"
          density="compact"
          hide-details
          class="mt-2"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">{{ t('common.actions.cancel') }}</v-btn>
        <v-btn
          v-if="!readonly"
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ t('common.actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
