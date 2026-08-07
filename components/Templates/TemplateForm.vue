<script setup lang="ts">
import { computed, watch } from 'vue';
import HtmlEditor from '~/components/Templates/HtmlEditor.vue';
import PdfBackgroundManager from '~/components/Templates/PdfBackgroundManager.vue';
import PdfEntriesEditor from '~/components/Templates/PdfEntriesEditor.vue';
import type { TemplateType, TemplateBodyFormat } from '~/types/api';

export interface TemplateFormData {
  name: string;
  type: TemplateType;
  body_format: TemplateBodyFormat;
  subject: string;
  description: string;
  is_active: boolean;
  body: string;
  sender: string;
  locked: boolean;
}

const props = defineProps<{
  mode: 'create' | 'edit';
  // Only set once the template has been persisted — the PDF background
  // manager attaches files to this id, so it can't do anything until one
  // exists (see the "save first" notice below for the create+positions case).
  templateId?: string;
}>();

const form = defineModel<TemplateFormData>({ required: true });

const { t } = useI18n();

const typeOptions = computed(() => [
  { value: 'text_email', title: t('pages.templates.typeTextEmail') },
  { value: 'sms', title: t('pages.templates.typeSms') },
  { value: 'html_email', title: t('pages.templates.typeHtmlEmail') },
  { value: 'ai_prompt', title: t('pages.templates.typeAiPrompt') },
  { value: 'pdf', title: t('pages.templates.typePdf') },
]);

const pdfBodyFormatOptions = computed(() => [
  { value: 'html', title: t('pages.templates.pdfModeDocument') },
  { value: 'positions', title: t('pages.templates.pdfModeUnderlay') },
]);

// body_format tracks type automatically for every non-pdf type (it's not a
// real authoring choice there — the type IS the format). pdf is the only
// type with two authoring models (spec: document-from-scratch vs. entries
// positioned over a background), so it gets its own selector.
watch(() => form.value.type, (type) => {
  if (type === 'text_email' || type === 'sms' || type === 'ai_prompt') form.value.body_format = 'text';
  else if (type === 'html_email') form.value.body_format = 'html';
  else if (type === 'pdf' && form.value.body_format !== 'html' && form.value.body_format !== 'positions') {
    form.value.body_format = 'html';
  }
});

const showsSubject = computed(() => form.value.type === 'text_email' || form.value.type === 'html_email');
const isPlainHtml = computed(() => form.value.type === 'html_email' || (form.value.type === 'pdf' && form.value.body_format === 'html'));
const isPdfUnderlay = computed(() => form.value.type === 'pdf' && form.value.body_format === 'positions');
const isSimpleText = computed(() => !isPlainHtml.value && !isPdfUnderlay.value);
</script>

<template>
  <v-form>
    <v-row>
      <v-col cols="12" md="8">
        <v-text-field
          v-model="form.name"
          :label="t('pages.templates.nameLabel')"
          variant="outlined"
          required
        />
      </v-col>
      <v-col cols="12" :md="form.type === 'pdf' ? 2 : 4">
        <v-select
          v-model="form.type"
          :items="typeOptions"
          item-title="title"
          item-value="value"
          :label="t('common.labels.type')"
          variant="outlined"
          :disabled="mode === 'edit'"
          :hint="mode === 'edit' ? t('pages.templates.typeImmutableHint') : undefined"
          persistent-hint
        />
      </v-col>
      <v-col v-if="form.type === 'pdf'" cols="12" md="2">
        <v-select
          v-model="form.body_format"
          :items="pdfBodyFormatOptions"
          item-title="title"
          item-value="value"
          :label="t('pages.templates.pdfModeLabel')"
          variant="outlined"
        />
      </v-col>

      <v-col v-if="showsSubject" cols="12">
        <v-text-field
          v-model="form.subject"
          :label="t('pages.templates.subjectLabel')"
          variant="outlined"
        />
      </v-col>

      <v-col cols="12">
        <v-textarea
          v-model="form.description"
          :label="t('common.labels.description')"
          variant="outlined"
          rows="2"
        />
      </v-col>

      <v-col cols="12">
        <label class="text-body-2 font-weight-medium d-block mb-2">{{ t('pages.templates.bodyLabel') }}</label>

        <HtmlEditor v-if="isPlainHtml" v-model="form.body" />

        <v-textarea
          v-else-if="isSimpleText"
          v-model="form.body"
          variant="outlined"
          rows="8"
          :placeholder="t('pages.templates.bodyPlaceholder')"
        />

        <template v-else-if="isPdfUnderlay">
          <template v-if="templateId">
            <div class="mb-6">
              <label class="text-body-2 font-weight-medium d-block mb-2">{{ t('pages.templates.backgroundLabel') }}</label>
              <PdfBackgroundManager :template-id="templateId" />
            </div>
            <label class="text-body-2 font-weight-medium d-block mb-2">{{ t('pages.templates.entriesLabel') }}</label>
            <PdfEntriesEditor v-model="form.body" :template-id="templateId" />
          </template>
          <v-alert v-else type="info" variant="tonal">
            {{ t('pages.templates.saveFirstForPdf') }}
          </v-alert>
        </template>

        <div v-if="isSimpleText" class="text-caption text-medium-emphasis mt-2">
          {{ t('pages.templates.placeholderHint') }}
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <v-switch
          v-model="form.is_active"
          :label="t('pages.templates.activeSwitch')"
          color="primary"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-switch
          v-model="form.locked"
          :label="t('pages.templates.lockedSwitch')"
          color="primary"
          hide-details
        />
      </v-col>

      <v-col v-if="showsSubject" cols="12" md="6">
        <v-text-field
          v-model="form.sender"
          :label="t('pages.templates.senderLabel')"
          variant="outlined"
          type="email"
          :hint="t('pages.templates.senderHint')"
          persistent-hint
        />
      </v-col>
    </v-row>
  </v-form>
</template>
