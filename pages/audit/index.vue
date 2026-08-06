<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import type { AuditLogFilters } from '~/types/api';

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
});

const { t } = useI18n();

// Usar o composable de auditoria
const {
  logs,
  pagination,
  loading,
  error,
  loadLogs,
  nextPage,
  prevPage,
  goToPage,
  changePerPage,
  canGoNext,
  canGoPrev,
  pageNumbers,
  formatDate,
  getActionColor,
  getActionIcon,
  getModelName,
  loadLogById
} = useAudit();

// Estados reativos para filtros
const filters = ref<AuditLogFilters>({
  action: '',
  model_type: '',
  user_type: undefined,
  date_from: '',
  date_to: '',
  tags: '',
  per_page: 20,
  page: 1
});

// Estados para diálogos
const showLogDetailsDialog = ref(false);
const selectedLogId = ref<number | null>(null);
const selectedLogDetails = ref<any>(null);

// Opções de filtros
const actionOptions = computed(() => [
  { value: '', label: t('pages.audit.actionAll') },
  { value: 'created', label: t('pages.audit.actionCreated') },
  { value: 'updated', label: t('pages.audit.actionUpdated') },
  { value: 'deleted', label: t('pages.audit.actionDeleted') },
  { value: 'login', label: t('pages.audit.actionLogin') },
  { value: 'viewed', label: t('pages.audit.actionViewed') }
]);

const modelTypeOptions = computed(() => [
  { value: '', label: t('pages.audit.modelAll') },
  { value: 'App\\Models\\User', label: 'User' },
  { value: 'App\\Models\\Admin', label: 'Admin' },
  { value: 'App\\Models\\Role', label: 'Role' },
  { value: 'App\\Models\\Permission', label: 'Permission' }
]);

const userTypeOptions = computed(() => [
  { value: '', label: t('pages.audit.userTypeAll') },
  { value: 'Admin', label: 'Admin' },
  { value: 'User', label: 'User' }
]);

// Função para aplicar filtros
const applyFilters = () => {
  filters.value.page = 1; // Resetar para primeira página
  loadLogs(filters.value);
};

// Função para limpar filtros
const clearFilters = () => {
  filters.value = {
    action: '',
    model_type: '',
    user_type: undefined,
    date_from: '',
    date_to: '',
    tags: '',
    per_page: 20,
    page: 1
  };
  loadLogs(filters.value);
};

// Função para ver detalhes de um log
const viewLogDetails = async (logId: number) => {
  selectedLogId.value = logId;
  showLogDetailsDialog.value = true;
  
  const log = await loadLogById(logId);
  if (log) {
    selectedLogDetails.value = log;
  }
};

// Função para navegar páginas com filtros
const handleNextPage = () => {
  nextPage(filters.value);
};

const handlePrevPage = () => {
  prevPage(filters.value);
};

const handleGoToPage = (page: number) => {
  goToPage(page, filters.value);
};

const handleChangePerPage = (perPage: number) => {
  changePerPage(perPage, filters.value);
};

// Computed para contar logs filtrados
const logsCount = computed(() => {
  return pagination.value?.total || logs.value.length;
});

// Carregar logs quando a página for montada
onMounted(() => {
  loadLogs(filters.value);
});
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.audit.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.audit.subtitle') }}
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-6">
      <v-col cols="12">
        <UiChildCard :title="t('pages.audit.filters')">
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.action"
                :items="actionOptions"
                item-title="label"
                item-value="value"
                :label="t('pages.audit.action')"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.model_type"
                :items="modelTypeOptions"
                item-title="label"
                item-value="value"
                :label="t('pages.audit.model')"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.user_type"
                :items="userTypeOptions"
                item-title="label"
                item-value="value"
                :label="t('pages.audit.userType')"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="filters.tags"
                :label="t('pages.audit.tagsLabel')"
                variant="outlined"
                density="compact"
                clearable
                placeholder="security,critical"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="filters.date_from"
                :label="t('pages.audit.dateFrom')"
                type="date"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="filters.date_to"
                :label="t('pages.audit.dateTo')"
                type="date"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.per_page"
                :items="[10, 20, 50, 100]"
                :label="t('pages.audit.perPage')"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="3" class="d-flex align-end gap-2">
              <v-btn
                color="primary"
                @click="applyFilters"
                prepend-icon="mdi-filter"
                block
              >
                {{ t('pages.audit.applyFilters') }}
              </v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <div class="d-flex gap-2">
                <v-btn
                  variant="outlined"
                  @click="clearFilters"
                  prepend-icon="mdi-refresh"
                >
                  {{ t('common.actions.clearFilters') }}
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ t('pages.audit.logsFound', { count: logsCount }) }}
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
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Erro -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <UiChildCard>
          <v-alert type="error" variant="tonal" class="mb-0">
            {{ error }}
          </v-alert>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Tabela de Logs -->
    <v-row v-else>
      <v-col cols="12">
        <UiChildCard :title="t('pages.audit.listTitle')">
          <v-table fixed-header height="600px">
            <thead>
              <tr>
                <th class="text-left">{{ t('pages.audit.tableDateTime') }}</th>
                <th class="text-left">{{ t('pages.audit.userSection') }}</th>
                <th class="text-left">{{ t('pages.audit.action') }}</th>
                <th class="text-left">{{ t('pages.audit.tableModel') }}</th>
                <th class="text-left">{{ t('common.labels.description') }}</th>
                <th class="text-left">{{ t('pages.audit.tableTags') }}</th>
                <th class="text-center">{{ t('common.labels.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td>
                  <div class="text-body-2">{{ formatDate(log.created_at) }}</div>
                </td>
                <td>
                  <div>
                    <div class="font-weight-medium">{{ log.user.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ log.user.type }}
                    </div>
                  </div>
                </td>
                <td>
                  <v-chip
                    :color="getActionColor(log.action)"
                    variant="tonal"
                    size="small"
                    :prepend-icon="getActionIcon(log.action)"
                  >
                    {{ log.action }}
                  </v-chip>
                </td>
                <td>
                  <div>
                    <div class="font-weight-medium">{{ getModelName(log.model.type) }}</div>
                  </div>
                </td>
                <td>
                  <div class="text-body-2" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                    {{ log.description || '-' }}
                  </div>
                </td>
                <td>
                  <div class="d-flex gap-1 flex-wrap" v-if="log.tags && log.tags.length > 0">
                    <v-chip
                      v-for="tag in log.tags"
                      :key="tag"
                      :color="tag === 'critical' ? 'error' : tag === 'security' ? 'warning' : 'default'"
                      variant="tonal"
                      size="x-small"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>
                  <span v-else class="text-medium-emphasis">-</span>
                </td>
                <td>
                  <div class="d-flex justify-center">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="viewLogDetails(log.id)"
                      :title="t('pages.audit.viewDetails')"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
              <tr v-if="logs.length === 0">
                <td colspan="7" class="text-center py-8 text-medium-emphasis">
                  {{ t('pages.audit.noLogsFound') }}
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Paginação -->
          <div v-if="pagination" class="d-flex align-center justify-space-between mt-4">
            <div class="text-body-2 text-medium-emphasis">
              {{ t('pages.audit.showingRange', { from: pagination.from, to: pagination.to, total: pagination.total }) }}
            </div>
            
            <div class="d-flex align-center gap-2">
              <!-- Itens por página -->
              <v-select
                :model-value="pagination.per_page"
                @update:model-value="handleChangePerPage"
                :items="[10, 20, 50, 100]"
                variant="outlined"
                density="compact"
                hide-details
                style="width: 80px"
              />
              
              <!-- Navegação -->
              <v-btn
                icon
                variant="text"
                :disabled="!canGoPrev"
                @click="handlePrevPage"
                :title="t('pages.audit.previousPage')"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              
              <!-- Números das páginas -->
              <div class="d-flex gap-1">
                <v-btn
                  v-for="page in pageNumbers"
                  :key="page"
                  :color="page === pagination.current_page ? 'primary' : undefined"
                  variant="text"
                  size="small"
                  @click="handleGoToPage(page)"
                >
                  {{ page }}
                </v-btn>
              </div>
              
              <v-btn
                icon
                variant="text"
                :disabled="!canGoNext"
                @click="handleNextPage"
                :title="t('pages.audit.nextPage')"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>

    <!-- Dialog de Detalhes do Log -->
    <v-dialog v-model="showLogDetailsDialog" max-width="900px" scrollable>
      <v-card v-if="selectedLogDetails">
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <div class="text-h5">{{ t('pages.audit.detailsDialogTitle') }}</div>
            <div class="text-caption text-medium-emphasis">ID: {{ selectedLogDetails.id }}</div>
          </div>
          <v-btn
            icon
            variant="text"
            @click="showLogDetailsDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider />
        
        <v-card-text class="pa-4">
          <!-- Informações Básicas -->
          <v-row class="mb-4">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.basicInfo') }}</h3>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-body-2 text-medium-emphasis">{{ t('pages.audit.tableDateTime') }}</div>
              <div class="text-body-1">{{ formatDate(selectedLogDetails.created_at) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-body-2 text-medium-emphasis">{{ t('pages.audit.action') }}</div>
              <v-chip
                :color="getActionColor(selectedLogDetails.action)"
                variant="tonal"
                :prepend-icon="getActionIcon(selectedLogDetails.action)"
              >
                {{ selectedLogDetails.action }}
              </v-chip>
            </v-col>
          </v-row>

          <!-- Usuário -->
          <v-row class="mb-4">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.userSection') }}</h3>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-body-2 text-medium-emphasis">{{ t('common.labels.name') }}</div>
              <div class="text-body-1">{{ selectedLogDetails.user.name }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-body-2 text-medium-emphasis">{{ t('common.labels.type') }}</div>
              <div class="text-body-1">{{ selectedLogDetails.user.type }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-body-2 text-medium-emphasis">ID</div>
              <div class="text-body-1">{{ selectedLogDetails.user.id }}</div>
            </v-col>
          </v-row>

          <!-- Modelo -->
          <v-row class="mb-4">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.modelSection') }}</h3>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-body-2 text-medium-emphasis">{{ t('common.labels.type') }}</div>
              <div class="text-body-1">{{ selectedLogDetails.model.type }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-body-2 text-medium-emphasis">ID</div>
              <div class="text-body-1">{{ selectedLogDetails.model.id || 'N/A' }}</div>
            </v-col>
          </v-row>

          <!-- Descrição -->
          <v-row class="mb-4" v-if="selectedLogDetails.description">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.descriptionSection') }}</h3>
              <div class="text-body-1">{{ selectedLogDetails.description }}</div>
            </v-col>
          </v-row>

          <!-- Tags -->
          <v-row class="mb-4" v-if="selectedLogDetails.tags && selectedLogDetails.tags.length > 0">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.tagsSection') }}</h3>
              <div class="d-flex gap-2 flex-wrap">
                <v-chip
                  v-for="tag in selectedLogDetails.tags"
                  :key="tag"
                  :color="tag === 'critical' ? 'error' : tag === 'security' ? 'warning' : 'default'"
                  variant="tonal"
                >
                  {{ tag }}
                </v-chip>
              </div>
            </v-col>
          </v-row>

          <!-- Mudanças -->
          <v-row class="mb-4" v-if="selectedLogDetails.changes">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.changesSection') }}</h3>
              <v-row>
                <v-col cols="12" md="6" v-if="selectedLogDetails.changes.old">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ t('pages.audit.previousValues') }}</div>
                  <v-card variant="outlined" class="pa-3">
                    <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-word;">{{ JSON.stringify(selectedLogDetails.changes.old, null, 2) }}</pre>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6" v-if="selectedLogDetails.changes.new">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ t('pages.audit.newValues') }}</div>
                  <v-card variant="outlined" class="pa-3">
                    <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-word;">{{ JSON.stringify(selectedLogDetails.changes.new, null, 2) }}</pre>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <!-- Contexto -->
          <v-row class="mb-4" v-if="selectedLogDetails.context">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.contextSection') }}</h3>
              <v-row>
                <v-col cols="12" md="6" v-if="selectedLogDetails.context.ip">
                  <div class="text-body-2 text-medium-emphasis">IP</div>
                  <div class="text-body-1">{{ selectedLogDetails.context.ip }}</div>
                </v-col>
                <v-col cols="12" md="6" v-if="selectedLogDetails.context.method">
                  <div class="text-body-2 text-medium-emphasis">{{ t('pages.audit.httpMethod') }}</div>
                  <div class="text-body-1">{{ selectedLogDetails.context.method }}</div>
                </v-col>
                <v-col cols="12" v-if="selectedLogDetails.context.url">
                  <div class="text-body-2 text-medium-emphasis">URL</div>
                  <div class="text-body-1">{{ selectedLogDetails.context.url }}</div>
                </v-col>
                <v-col cols="12" v-if="selectedLogDetails.context.user_agent">
                  <div class="text-body-2 text-medium-emphasis">User Agent</div>
                  <div class="text-body-1 text-caption">{{ selectedLogDetails.context.user_agent }}</div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <!-- Metadata -->
          <v-row v-if="selectedLogDetails.metadata">
            <v-col cols="12">
              <h3 class="text-h6 mb-2">{{ t('pages.audit.metadataSection') }}</h3>
              <v-card variant="outlined" class="pa-3">
                <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-word;">{{ JSON.stringify(selectedLogDetails.metadata, null, 2) }}</pre>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="showLogDetailsDialog = false"
          >
            {{ t('common.actions.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

