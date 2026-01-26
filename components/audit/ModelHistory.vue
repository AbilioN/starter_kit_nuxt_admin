<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { AuditLog } from '~/types/api';
import UiChildCard from '@/components/shared/UiChildCard.vue';

interface Props {
  modelType: string;
  modelId: number;
}

const props = defineProps<Props>();

const { loadModelHistory, formatDate, getActionColor, getActionIcon, getModelName, loading, error } = useAudit();

const history = ref<AuditLog[]>([]);

const loadHistory = async () => {
  const result = await loadModelHistory(props.modelType, props.modelId);
  if (result) {
    history.value = result;
  }
};

onMounted(() => {
  loadHistory();
});
</script>

<template>
  <div>
    <UiChildCard :title="`Histórico: ${getModelName(modelType)} #${modelId}`">
      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-center align-center py-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>

      <!-- Erro -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- Timeline -->
      <div v-else-if="history.length > 0" class="history-timeline">
        <div
          v-for="(log, index) in history"
          :key="log.id"
          class="history-item"
          :class="{ 'mb-4': index < history.length - 1 }"
        >
          <div class="d-flex gap-4">
            <!-- Ícone da ação -->
            <div class="history-icon">
              <v-avatar
                :color="getActionColor(log.action)"
                size="40"
              >
                <v-icon :color="'white'">{{ getActionIcon(log.action) }}</v-icon>
              </v-avatar>
            </div>

            <!-- Conteúdo -->
            <div class="flex-grow-1">
              <div class="d-flex align-center justify-space-between mb-2">
                <div>
                  <v-chip
                    :color="getActionColor(log.action)"
                    variant="tonal"
                    size="small"
                    class="mr-2"
                  >
                    {{ log.action }}
                  </v-chip>
                  <span class="text-body-2 text-medium-emphasis">
                    por {{ log.user.name }} ({{ log.user.type }})
                  </span>
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ formatDate(log.created_at) }}
                </div>
              </div>

              <div class="text-body-1 mb-2" v-if="log.description">
                {{ log.description }}
              </div>

              <!-- Tags -->
              <div class="d-flex gap-1 mb-2" v-if="log.tags && log.tags.length > 0">
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

              <!-- Mudanças -->
              <v-expansion-panels v-if="log.changes && (log.changes.old || log.changes.new)" variant="accordion" class="mt-2">
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    Ver Mudanças
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="12" md="6" v-if="log.changes.old">
                        <div class="text-body-2 text-medium-emphasis mb-2">Valores Anteriores</div>
                        <v-card variant="outlined" class="pa-3">
                          <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-word; font-size: 0.75rem;">{{ JSON.stringify(log.changes.old, null, 2) }}</pre>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="6" v-if="log.changes.new">
                        <div class="text-body-2 text-medium-emphasis mb-2">Valores Novos</div>
                        <v-card variant="outlined" class="pa-3">
                          <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-word; font-size: 0.75rem;">{{ JSON.stringify(log.changes.new, null, 2) }}</pre>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </div>

          <!-- Linha conectora -->
          <div v-if="index < history.length - 1" class="history-connector"></div>
        </div>
      </div>

      <!-- Sem histórico -->
      <div v-else class="text-center py-8 text-medium-emphasis">
        Nenhum histórico encontrado para este modelo
      </div>
    </UiChildCard>
  </div>
</template>

<style scoped>
.history-timeline {
  position: relative;
}

.history-item {
  position: relative;
}

.history-icon {
  flex-shrink: 0;
}

.history-connector {
  position: absolute;
  left: 20px;
  top: 40px;
  bottom: -16px;
  width: 2px;
  background: rgba(var(--v-theme-on-surface), 0.12);
}
</style>

