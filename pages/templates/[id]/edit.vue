<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import TemplateForm, { type TemplateFormData } from '~/components/Templates/TemplateForm.vue';
import type { UpdateTemplateRequest } from '~/types/api';

definePageMeta({
  middleware: ['auth', 'permissions'],
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { hasPermission } = usePermissions();
const { loading, saving, getTemplate, updateTemplate, deleteTemplate, preview, previewPdf } = useTemplates();

const templateId = route.params.id as string;

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

const notFound = ref(false);
const saveError = ref<string | null>(null);
const showDeleteDialog = ref(false);
const deleting = ref(false);

const load = async () => {
  const tpl = await getTemplate(templateId);
  if (!tpl) {
    notFound.value = true;
    return;
  }
  form.value = {
    name: tpl.name,
    type: tpl.type,
    body_format: tpl.body_format,
    subject: tpl.subject ?? '',
    description: tpl.description ?? '',
    is_active: tpl.is_active,
    body: tpl.body ?? '',
    sender: tpl.options?.sender ?? '',
    locked: tpl.options?.locked ?? false,
  };
};

const save = async () => {
  saveError.value = null;

  const payload: UpdateTemplateRequest = {
    name: form.value.name,
    body_format: form.value.body_format,
    body: form.value.body || null,
    subject: form.value.subject || null,
    description: form.value.description || null,
    is_active: form.value.is_active,
    options: {
      sender: form.value.sender || undefined,
      locked: form.value.locked || undefined,
    },
  };

  const updated = await updateTemplate(templateId, payload);
  if (!updated) {
    saveError.value = t('pages.templates.saveFailed');
  }
};

const confirmDelete = async () => {
  deleting.value = true;
  const ok = await deleteTemplate(templateId);
  deleting.value = false;
  if (ok) {
    router.push('/templates');
  } else {
    showDeleteDialog.value = false;
  }
};

// Preview — text/html templates render straight into the dialog (the
// content is either plain text or already-safe HTML produced by our own
// editor). 'pdf' templates respond with raw PDF bytes instead, which get
// opened as a blob: URL in a new tab rather than crammed into the dialog.
const showPreviewDialog = ref(false);
const previewLoading = ref(false);
const previewResult = ref<{ contentType: string; content: string } | null>(null);
let previewObjectUrl: string | null = null;

const openPreview = async () => {
  if (form.value.type === 'pdf') {
    previewLoading.value = true;
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = await previewPdf(templateId);
    previewLoading.value = false;
    if (previewObjectUrl) window.open(previewObjectUrl, '_blank');
    return;
  }

  previewLoading.value = true;
  showPreviewDialog.value = true;
  const result = await preview(templateId);
  previewLoading.value = false;
  if (result) {
    previewResult.value = { contentType: result.content_type, content: result.content };
  }
};

onBeforeUnmount(() => {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
});

onMounted(load);
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
            <h1 class="text-h4 font-weight-bold">{{ t('pages.templates.editTemplate') }}</h1>
            <p class="text-body-1 text-medium-emphasis">{{ form.name }}</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="!hasPermission('template-update')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">{{ t('pages.templates.noPermission') }}</v-alert>
      </v-col>
    </v-row>

    <v-row v-else-if="loading">
      <v-col cols="12">
        <UiChildCard>
          <div class="d-flex justify-center align-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <v-row v-else-if="notFound">
      <v-col cols="12">
        <v-alert type="error" variant="tonal">{{ t('pages.templates.notFound') }}</v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <UiChildCard>
          <TemplateForm v-model="form" mode="edit" :template-id="templateId" />

          <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ saveError }}
          </v-alert>

          <v-divider class="my-6" />
          <div class="d-flex ga-3">
            <v-btn color="primary" :loading="saving" :disabled="saving || !form.name" prepend-icon="mdi-content-save-outline" @click="save">
              {{ t('common.actions.saveChanges') }}
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-eye-outline" :loading="previewLoading" @click="openPreview">
              {{ t('pages.templates.previewButton') }}
            </v-btn>
            <v-spacer />
            <v-btn v-if="hasPermission('template-delete')" color="error" variant="text" prepend-icon="mdi-delete-outline" @click="showDeleteDialog = true">
              {{ t('common.actions.delete') }}
            </v-btn>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Delete dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ t('pages.templates.deleteDialogTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ t('pages.templates.deleteConfirmBody') }}</p>
          <p><strong>{{ form.name }}</strong></p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="deleting" @click="showDeleteDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="error" :loading="deleting" :disabled="deleting" @click="confirmDelete">
            {{ t('common.actions.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Preview dialog (text/html only — pdf opens in a new tab) -->
    <v-dialog v-model="showPreviewDialog" max-width="700px" scrollable>
      <v-card>
        <v-card-title>{{ t('pages.templates.previewButton') }}</v-card-title>
        <v-card-text>
          <div v-if="previewLoading" class="d-flex justify-center align-center py-8">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="previewResult">
            <div v-if="previewResult.contentType === 'text/html'" v-html="previewResult.content" />
            <pre v-else class="preview-text">{{ previewResult.content }}</pre>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showPreviewDialog = false">{{ t('common.actions.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.preview-text {
  white-space: pre-wrap;
  font-family: inherit;
}
</style>
