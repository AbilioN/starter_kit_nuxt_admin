<script setup lang="ts">
import ModelHistory from '@/components/audit/ModelHistory.vue';

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
});

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
            <h1 class="text-h4 font-weight-bold">Histórico do Modelo</h1>
            <p class="text-body-1 text-medium-emphasis">
              Visualize todo o histórico de mudanças deste registro
            </p>
          </div>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            @click="$router.back()"
          >
            Voltar
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

