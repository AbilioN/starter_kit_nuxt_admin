<script setup lang="ts">
import { ref } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import LineChart from '@/components/charts/LineChart.vue';
import BarChart from '@/components/charts/BarChart.vue';
import PieChart from '@/components/charts/PieChart.vue';
import DonutChart from '@/components/charts/DonutChart.vue';
import AreaChart from '@/components/charts/AreaChart.vue';
import RadarChart from '@/components/charts/RadarChart.vue';
import RadialBarChart from '@/components/charts/RadialBarChart.vue';
import HeatmapChart from '@/components/charts/HeatmapChart.vue';
import TreemapChart from '@/components/charts/TreemapChart.vue';
import PolarAreaChart from '@/components/charts/PolarAreaChart.vue';

// Definir middleware de autenticação
definePageMeta({
  middleware: 'auth'
});

const { user } = useAuth();
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
        <p class="text-body-1 text-medium-emphasis">
          Welcome, {{ user?.name || 'User' }}! Here are various chart types for data visualization.
        </p>
      </v-col>
    </v-row>
    
    <!-- Statistics Cards -->
    <v-row>
      <v-col cols="12" sm="6" lg="3">
        <UiChildCard>
          <div class="text-center">
            <v-icon size="48" color="primary">mdi-account-group</v-icon>
            <h3 class="text-h3 mt-2">2,456</h3>
            <p class="text-medium-emphasis">Total Users</p>
          </div>
        </UiChildCard>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <UiChildCard>
          <div class="text-center">
            <v-icon size="48" color="success">mdi-currency-usd</v-icon>
            <h3 class="text-h3 mt-2">$45.2k</h3>
            <p class="text-medium-emphasis">Revenue</p>
          </div>
        </UiChildCard>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <UiChildCard>
          <div class="text-center">
            <v-icon size="48" color="warning">mdi-chart-line</v-icon>
            <h3 class="text-h3 mt-2">1,843</h3>
            <p class="text-medium-emphasis">Active Sessions</p>
          </div>
        </UiChildCard>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <UiChildCard>
          <div class="text-center">
            <v-icon size="48" color="error">mdi-shield-check</v-icon>
            <h3 class="text-h3 mt-2">98.5%</h3>
            <p class="text-medium-emphasis">System Health</p>
          </div>
        </UiChildCard>
      </v-col>
    </v-row>
    
    <!-- Line and Area Charts -->
    <v-row>
      <v-col cols="12" lg="6">
        <UiChildCard title="Line Chart Example">
          <LineChart title="Monthly Sales & Revenue Trends" />
        </UiChildCard>
      </v-col>
      <v-col cols="12" lg="6">
        <UiChildCard title="Area Chart Example">
          <AreaChart title="Traffic Over Time" />
        </UiChildCard>
      </v-col>
    </v-row>
    
    <!-- Bar Chart -->
    <v-row>
      <v-col cols="12">
        <UiChildCard title="Bar Chart Example">
          <BarChart title="Financial Metrics Comparison" />
        </UiChildCard>
      </v-col>
    </v-row>
    
    <!-- Pie and Donut Charts -->
    <v-row>
      <v-col cols="12" lg="6">
        <UiChildCard title="Pie Chart Example">
          <PieChart title="Market Share Distribution" />
        </UiChildCard>
      </v-col>
      <v-col cols="12" lg="6">
        <UiChildCard title="Donut Chart Example">
          <DonutChart title="Product Sales Distribution" />
        </UiChildCard>
      </v-col>
    </v-row>
    
    <!-- Radar and Radial Bar -->
    <v-row>
      <v-col cols="12" lg="6">
        <UiChildCard title="Radar Chart Example">
          <RadarChart title="Performance Metrics" />
        </UiChildCard>
      </v-col>
      <v-col cols="12" lg="6">
        <UiChildCard title="Radial Bar Chart Example">
          <RadialBarChart title="Social Media Engagement" />
        </UiChildCard>
      </v-col>
    </v-row>
    
    <!-- Heatmap -->
    <v-row>
      <v-col cols="12">
        <UiChildCard title="Heatmap Chart Example">
          <HeatmapChart title="Activity Heatmap" />
        </UiChildCard>
      </v-col>
    </v-row>
    
    <!-- Treemap and Polar Area -->
    <v-row>
      <v-col cols="12" lg="6">
        <UiChildCard title="Treemap Chart Example">
          <TreemapChart title="Regional Distribution" />
        </UiChildCard>
      </v-col>
      <v-col cols="12" lg="6">
        <UiChildCard title="Polar Area Chart Example">
          <PolarAreaChart title="Multi-Series Data" />
        </UiChildCard>
      </v-col>
    </v-row>
    
    <!-- Candlestick -->
    <v-row>
      <v-col cols="12">
        <UiChildCard title="Candlestick Chart Example">
          <CandlestickChart title="Stock Price Movement" />
        </UiChildCard>
      </v-col>
    </v-row>
  </div>
</template>
