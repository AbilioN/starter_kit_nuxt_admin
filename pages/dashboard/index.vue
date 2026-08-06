<script setup lang="ts">
import { onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import LineChart from '@/components/charts/LineChart.vue';
import BarChart from '@/components/charts/BarChart.vue';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const { user } = useAuth();
const { metrics, loading, error, loadMetrics, formatBytes } = useDashboard();

onMounted(loadMetrics);

const newUsersChartOptions = computed(() => ({
  chart: { id: 'new-users', toolbar: { show: false } },
  xaxis: { categories: metrics.value?.users.per_day_last_7.map(d => d.date.slice(5)) ?? [] },
  colors: ['#5D87FF'],
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
  dataLabels: { enabled: false },
}));

const newUsersSeries = computed(() => [{
  name: 'New Users',
  data: metrics.value?.users.per_day_last_7.map(d => d.count) ?? [],
}]);

const messagesChartOptions = computed(() => ({
  chart: { id: 'messages', toolbar: { show: false } },
  xaxis: { categories: metrics.value?.chats.messages_per_day_last_7.map(d => d.date.slice(5)) ?? [] },
  colors: ['#13DEB9'],
  plotOptions: { bar: { borderRadius: 4 } },
  dataLabels: { enabled: false },
}));

const messagesSeries = computed(() => [{
  name: 'Messages',
  data: metrics.value?.chats.messages_per_day_last_7.map(d => d.count) ?? [],
}]);
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">{{ t('pages.dashboard.title') }}</h1>
        <p class="text-body-1 text-medium-emphasis">
          {{ t('pages.dashboard.welcome', { name: user?.name || 'User' }) }}
        </p>
      </v-col>
    </v-row>

    <!-- Loading skeleton -->
    <v-row v-if="loading">
      <v-col v-for="i in 4" :key="i" cols="12" sm="6" lg="3">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <!-- Error -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal">{{ error }}</v-alert>
      </v-col>
    </v-row>

    <template v-else-if="metrics">
      <!-- Stat cards -->
      <v-row>
        <v-col cols="12" sm="6" lg="3">
          <UiChildCard>
            <div class="d-flex align-center gap-4">
              <v-avatar size="56" color="primary" variant="tonal">
                <v-icon size="28">mdi-account-group</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ metrics.users.total.toLocaleString() }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ t('pages.dashboard.totalUsers') }}</div>
                <div class="text-caption text-success">{{ t('pages.dashboard.thisWeek', { count: metrics.users.new_this_week }) }}</div>
              </div>
            </div>
          </UiChildCard>
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <UiChildCard>
            <div class="d-flex align-center gap-4">
              <v-avatar size="56" color="success" variant="tonal">
                <v-icon size="28">mdi-shield-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ metrics.admins.total }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ t('pages.dashboard.admins') }}</div>
              </div>
            </div>
          </UiChildCard>
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <UiChildCard>
            <div class="d-flex align-center gap-4">
              <v-avatar size="56" color="warning" variant="tonal">
                <v-icon size="28">mdi-chat-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ metrics.chats.total.toLocaleString() }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ t('pages.dashboard.chats') }}</div>
                <div class="text-caption text-medium-emphasis">{{ t('pages.dashboard.msgThisWeek', { count: metrics.chats.messages_this_week }) }}</div>
              </div>
            </div>
          </UiChildCard>
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <UiChildCard>
            <div class="d-flex align-center gap-4">
              <v-avatar size="56" color="info" variant="tonal">
                <v-icon size="28">mdi-file-multiple-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ metrics.storage.total_files }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ t('pages.dashboard.files') }}</div>
                <div class="text-caption text-medium-emphasis">{{ t('pages.dashboard.used', { size: formatBytes(metrics.storage.bytes_used) }) }}</div>
              </div>
            </div>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Charts row -->
      <v-row>
        <v-col cols="12" lg="6">
          <UiChildCard :title="t('pages.dashboard.newUsersChart')">
            <apexchart
              v-if="newUsersSeries[0].data.length"
              type="area"
              height="200"
              :options="newUsersChartOptions"
              :series="newUsersSeries"
            />
            <div v-else class="text-center text-medium-emphasis py-8">{{ t('pages.dashboard.noDataYet') }}</div>
          </UiChildCard>
        </v-col>

        <v-col cols="12" lg="6">
          <UiChildCard :title="t('pages.dashboard.messagesChart')">
            <apexchart
              v-if="messagesSeries[0].data.length"
              type="bar"
              height="200"
              :options="messagesChartOptions"
              :series="messagesSeries"
            />
            <div v-else class="text-center text-medium-emphasis py-8">{{ t('pages.dashboard.noDataYet') }}</div>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Audit action distribution -->
      <v-row v-if="Object.keys(metrics.audit.action_distribution).length > 0">
        <v-col cols="12" md="6">
          <UiChildCard :title="t('pages.dashboard.auditActionsChart')">
            <v-list density="compact">
              <v-list-item
                v-for="(count, action) in metrics.audit.action_distribution"
                :key="action"
                class="px-0"
              >
                <template #prepend>
                  <v-chip color="primary" variant="tonal" size="x-small" class="mr-3">
                    {{ count }}
                  </v-chip>
                </template>
                <v-list-item-title class="text-body-2">{{ action }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </UiChildCard>
        </v-col>

        <v-col cols="12" md="6">
          <UiChildCard :title="t('pages.dashboard.thisMonth')">
            <v-list density="compact">
              <v-list-item class="px-0">
                <template #prepend>
                  <v-icon color="primary" class="mr-3">mdi-account-plus-outline</v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{ t('pages.dashboard.newUsersThisMonth') }}</v-list-item-title>
                <template #append>
                  <span class="font-weight-bold">{{ metrics.users.new_this_month }}</span>
                </template>
              </v-list-item>
              <v-list-item class="px-0">
                <template #prepend>
                  <v-icon color="success" class="mr-3">mdi-message-text-outline</v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{ t('pages.dashboard.messagesThisWeek') }}</v-list-item-title>
                <template #append>
                  <span class="font-weight-bold">{{ metrics.chats.messages_this_week }}</span>
                </template>
              </v-list-item>
              <v-list-item class="px-0">
                <template #prepend>
                  <v-icon color="info" class="mr-3">mdi-harddisk</v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{ t('pages.dashboard.storageUsed') }}</v-list-item-title>
                <template #append>
                  <span class="font-weight-bold">{{ formatBytes(metrics.storage.bytes_used) }}</span>
                </template>
              </v-list-item>
            </v-list>
          </UiChildCard>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
