<script setup lang="ts">
import { ref } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import TemplateForm, { type TemplateFormData } from '~/components/Templates/TemplateForm.vue';
import type { CreateTemplateRequest } from '~/types/api';

definePageMeta({
  middleware: ['auth', 'permissions'],
});

const { t } = useI18n();
const router = useRouter();
const { hasPermission } = usePermissions();
const { saving, createTemplate } = useTemplates();

const form = ref<TemplateFormData>({
  name: '',
  type: 'text_email',
  body_format: 'text',
  subject: '',
  description: '',
  is_active: true,
  body: '',
  sender: '',
  locked: false,
});

const saveError = ref<string | null>(null);

const save = async () => {
  saveError.value = null;

  // pdf+positions can't attach a background or entries until the template
  // has an id (see TemplateForm's "save first" notice) — '[]' keeps the
  // stored body valid JSON in the meantime, matching what the entries
  // editor itself would produce for an empty entry list.
  const body = form.value.type === 'pdf' && form.value.body_format === 'positions' && !form.value.body
    ? '[]'
    : form.value.body || null;

  const payload: CreateTemplateRequest = {
    name: form.value.name,
    type: form.value.type,
    body_format: form.value.body_format,
    body,
    subject: form.value.subject || null,
    description: form.value.description || null,
    is_active: form.value.is_active,
    options: {
      sender: form.value.sender || undefined,
      locked: form.value.locked || undefined,
    },
  };

  const created = await createTemplate(payload);
  if (!created) {
    saveError.value = t('pages.templates.saveFailed');
    return;
  }

  if (created.type === 'pdf' && created.body_format === 'positions') {
    router.push(`/templates/${created.id}/edit`);
  } else {
    router.push('/templates');
  }
};
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center ga-3">
          <v-btn icon variant="text" :to="'/templates'">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.templates.createTemplate') }}</h1>
            <p class="text-body-1 text-medium-emphasis">{{ t('pages.templates.createSubtitle') }}</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="!hasPermission('template-create')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">{{ t('pages.templates.noPermission') }}</v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <UiChildCard>
          <TemplateForm v-model="form" mode="create" />

          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ saveError }}
          </v-alert>

          <v-divider class="my-6" />
          <div class="d-flex ga-3">
            <v-btn color="primary" :loading="saving" :disabled="saving || !form.name" prepend-icon="mdi-content-save-outline" @click="save">
              {{ t('common.actions.create') }}
            </v-btn>
            <v-btn variant="text" :disabled="saving" :to="'/templates'">
              {{ t('common.actions.cancel') }}
            </v-btn>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>
  </div>
</template>
