<script setup lang="ts">
import { ref, onMounted } from "vue";
import ProfitExpanse from "@/components/dashboards/ProfitExpense.vue";
import TrafficDistribution from "@/components/dashboards/TrafficDistribution.vue";
import ProductSales from "@/components/dashboards/ProductSales.vue";
import UpcommingSchedule from "@/components/dashboards/UpcommingSchedule.vue";
import TopPayingClients from "@/components/dashboards/TopPayingClients.vue";
import ProductCards from "@/components/dashboards/ProductCards.vue";

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
});

const { isAuthenticated } = useAuth();

// Redirecionar para dashboard se estiver autenticado, senão para login
onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo('/dashboard');
  } else {
    navigateTo('/auth/login');
  }
});
</script>

<template>
    <div class="d-flex justify-center align-center" style="height: 50vh;">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
</template>