<script setup lang="ts">
import { computed } from 'vue';
import HtmlEditor from '~/components/Templates/HtmlEditor.vue';
import type { TemplateType } from '~/types/api';

export interface TemplateFormData {
  name: string;
  type: TemplateType;
  subject: string;
  description: string;
  is_active: boolean;
  body: string;
  sender: string;
  locked: boolean;
}

const props = defineProps<{
  mode: 'create' | 'edit';
}>();

const form = defineModel<TemplateFormData>({ required: true });

const { t } = useI18n();

// PDF is intentionally left out of the type picker — it has its own
// underlay/positions editor (Expert JSON mode, then the Standard canvas
// mode) that hasn't been built yet. It stays a valid `type` server-side.
const typeOptions = computed(() => [
  { value: 'text_email', title: t('pages.templates.typeTextEmail') },
  { value: 'sms', title: t('pages.templates.typeSms') },
  { value: 'html_email', title: t('pages.templates.typeHtmlEmail') },
  { value: 'ai_prompt', title: t('pages.templates.typeAiPrompt') },
]);

const showsSubject = computed(() => form.value.type === 'text_email' || form.value.type === 'html_email');
const isHtml = computed(() => form.value.type === 'html_email');
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
      <v-col cols="12" md="4">
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
        <HtmlEditor v-if="isHtml" v-model="form.body" />
        <v-textarea
          v-else
          v-model="form.body"
          variant="outlined"
          rows="8"
          :placeholder="t('pages.templates.bodyPlaceholder')"
        />
        <div class="text-caption text-medium-emphasis mt-2">
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
