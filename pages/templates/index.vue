<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import type { Template, TemplateType } from '~/types/api';

definePageMeta({
  middleware: ['auth', 'permissions'],
});

const { t } = useI18n();
const router = useRouter();

const {
  templates,
  pagination,
  loading,
  error,
  loadTemplates,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers,
  deleteTemplate,
} = useTemplates();

const { hasPermission } = usePermissions();
const notification = useNotification();

const search = ref('');
const selectedType = ref<TemplateType | 'all'>('all');
const showDeleteDialog = ref(false);
const selectedTemplate = ref<Template | null>(null);
const deleting = ref(false);

const typeMeta: Record<TemplateType, { label: string; icon: string; color: string }> = {
  text_email: { label: t('pages.templates.typeTextEmail'), icon: 'mdi-email-outline', color: 'info' },
  sms: { label: t('pages.templates.typeSms'), icon: 'mdi-message-text-outline', color: 'success' },
  html_email: { label: t('pages.templates.typeHtmlEmail'), icon: 'mdi-email-fast-outline', color: 'primary' },
  pdf: { label: t('pages.templates.typePdf'), icon: 'mdi-file-pdf-box', color: 'error' },
  ai_prompt: { label: t('pages.templates.typeAiPrompt'), icon: 'mdi-robot-outline', color: 'warning' },
};

const typeOptions = computed(() => [
  { value: 'all', label: t('pages.templates.allTypes') },
  { value: 'text_email', label: typeMeta.text_email.label },
  { value: 'sms', label: typeMeta.sms.label },
  { value: 'html_email', label: typeMeta.html_email.label },
  { value: 'pdf', label: typeMeta.pdf.label },
  { value: 'ai_prompt', label: typeMeta.ai_prompt.label },
]);

const filteredTemplates = computed(() => {
  if (!search.value) return templates.value;
  const q = search.value.toLowerCase();
  return templates.value.filter(tpl =>
    tpl.name.toLowerCase().includes(q) ||
    (tpl.description ?? '').toLowerCase().includes(q)
  );
});

const fetchWithFilters = (page = 1) => {
  const type = selectedType.value === 'all' ? undefined : selectedType.value;
  loadTemplates(page, pagination.value?.per_page ?? 15, type);
};

const clearFilters = () => {
  search.value = '';
  selectedType.value = 'all';
  fetchWithFilters(1);
};

const createTemplate = () => {
  if (hasPermission('template-create')) {
    router.push('/templates/create');
  }
};

const editTemplate = (tpl: Template) => {
  if (hasPermission('template-update')) {
    router.push(`/templates/${tpl.id}/edit`);
  }
};

const confirmDeleteTemplate = (tpl: Template) => {
  if (hasPermission('template-delete')) {
    selectedTemplate.value = tpl;
    showDeleteDialog.value = true;
  }
};

const confirmDelete = async () => {
  if (!selectedTemplate.value) return;
  deleting.value = true;
  const ok = await deleteTemplate(selectedTemplate.value.id);
  deleting.value = false;
  if (ok) {
    showDeleteDialog.value = false;
    selectedTemplate.value = null;
  }
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

onMounted(() => fetchWithFilters());
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.templates.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.templates.subtitle') }}
            </p>
          </div>
          <v-btn
            v-if="hasPermission('template-create')"
            color="primary"
            prepend-icon="mdi-plus"
            size="large"
            @click="createTemplate"
          >
            {{ t('pages.templates.createTemplate') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- No permission -->
    <v-row v-if="!hasPermission('template-read')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">
          {{ t('pages.templates.noPermission') }}
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Filtros -->
      <v-row class="mb-6">
        <v-col cols="12">
          <UiChildCard :title="t('pages.templates.filters')">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="search"
                  :label="t('pages.templates.searchPlaceholder')"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedType"
                  :items="typeOptions"
                  item-title="label"
                  item-value="value"
                  :label="t('common.labels.type')"
                  variant="outlined"
                  density="compact"
                  @update:model-value="fetchWithFilters(1)"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <div class="d-flex gap-2">
                  <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="clearFilters">
                    {{ t('common.actions.clearFilters') }}
                  </v-btn>
                  <v-chip color="primary" variant="tonal" class="ml-auto">
                    {{ t('pages.templates.templatesFound', { count: filteredTemplates.length }) }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Loading -->
      <v-row v-if="loading">
        <v-col cols="12">
          <UiChildCard>
            <div class="d-flex justify-center align-center py-8">
              <v-progress-circular indeterminate color="primary" size="64" />
            </div>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Erro -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <UiChildCard>
            <v-alert type="error" variant="tonal" class="mb-0">{{ error }}</v-alert>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Tabela -->
      <v-row v-else>
        <v-col cols="12">
          <UiChildCard :title="t('pages.templates.listTitle')">
            <!-- Empty state -->
            <div
              v-if="filteredTemplates.length === 0"
              class="d-flex flex-column align-center justify-center py-12 text-medium-emphasis"
            >
              <v-icon size="64" class="mb-4">mdi-file-document-outline</v-icon>
              <p>{{ t('pages.templates.noTemplatesFound') }}</p>
            </div>

            <v-table v-else fixed-header height="600px">
              <thead>
                <tr>
                  <th class="text-left">{{ t('common.labels.name') }}</th>
                  <th class="text-left">{{ t('common.labels.type') }}</th>
                  <th class="text-left">{{ t('common.labels.status') }}</th>
                  <th class="text-left">{{ t('pages.templates.tableUpdated') }}</th>
                  <th class="text-center">{{ t('common.labels.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tpl in filteredTemplates" :key="tpl.id">
                  <td>
                    <div class="font-weight-medium">{{ tpl.name }}</div>
                    <div v-if="tpl.description" class="text-caption text-medium-emphasis">
                      {{ tpl.description }}
                    </div>
                  </td>
                  <td>
                    <v-chip :color="typeMeta[tpl.type].color" variant="tonal" size="small" :prepend-icon="typeMeta[tpl.type].icon">
                      {{ typeMeta[tpl.type].label }}
                    </v-chip>
                  </td>
                  <td>
                    <v-chip :color="tpl.is_active ? 'success' : 'error'" variant="tonal" size="small">
                      {{ tpl.is_active ? t('common.labels.active') : t('common.labels.inactive') }}
                    </v-chip>
                  </td>
                  <td>{{ formatDate(tpl.updated_at) }}</td>
                  <td>
                    <div class="d-flex justify-center gap-1">
                      <v-btn
                        v-if="hasPermission('template-update')"
                        icon
                        size="small"
                        variant="text"
                        color="primary"
                        :title="t('common.actions.edit')"
                        @click="editTemplate(tpl)"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="hasPermission('template-delete')"
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        :title="t('common.actions.delete')"
                        @click="confirmDeleteTemplate(tpl)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <!-- Paginação -->
            <div v-if="pagination && pagination.last_page > 1" class="d-flex align-center justify-space-between mt-4">
              <div class="text-body-2 text-medium-emphasis">
                {{ t('pages.admins.showingRange', { from: pagination.from, to: pagination.to, total: pagination.total }) }}
              </div>
              <div class="d-flex align-center gap-2">
                <v-select
                  :model-value="pagination.per_page"
                  :items="[10, 15, 25, 50]"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="width: 80px"
                  @update:model-value="(v: number) => changePerPage(v, selectedType === 'all' ? undefined : selectedType)"
                />
                <v-btn icon variant="text" :disabled="!canGoPrev" @click="prevPage(selectedType === 'all' ? undefined : selectedType)">
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <div class="d-flex gap-1">
                  <v-btn
                    v-for="page in pageNumbers"
                    :key="page"
                    :color="page === pagination.current_page ? 'primary' : undefined"
                    variant="text"
                    size="small"
                    @click="goToPage(page, selectedType === 'all' ? undefined : selectedType)"
                  >
                    {{ page }}
                  </v-btn>
                </div>
                <v-btn icon variant="text" :disabled="!canGoNext" @click="nextPage(selectedType === 'all' ? undefined : selectedType)">
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
              </div>
            </div>
            <div v-else-if="pagination" class="d-flex justify-end mt-4">
              <div class="text-body-2 text-medium-emphasis">
                {{ t('pages.templates.totalTemplates', { count: pagination.total }) }}
              </div>
            </div>
          </UiChildCard>
        </v-col>
      </v-row>
    </template>

    <!-- Delete dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ t('pages.templates.deleteDialogTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ t('pages.templates.deleteConfirmBody') }}</p>
          <p><strong>{{ selectedTemplate?.name }}</strong></p>
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
  </div>
</template>
