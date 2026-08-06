<script setup lang="ts">
import ModelHistory from '@/components/audit/ModelHistory.vue';

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
});

const { t } = useI18n();

// Obter parâmetros da rota
const route = useRoute();
const modelType = decodeURIComponent(route.params.type as string);
const modelId = Number(route.params.id);
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.auditModel.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.auditModel.subtitle') }}
            </p>
          </div>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            @click="$router.back()"
          >
            {{ t('common.actions.back') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Componente de Histórico -->
    <v-row>
      <v-col cols="12">
        <ModelHistory :model-type="modelType" :model-id="modelId" />
      </v-col>
    </v-row>
  </div>
</template>

