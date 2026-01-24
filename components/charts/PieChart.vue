<template>
  <div>
    <apexchart
      type="pie"
      height="350"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string;
}>();

const series = [44, 55, 13, 43, 22];

const chartOptions = {
  chart: {
    type: 'pie'
  },
  title: {
    text: props.title || 'Pie Chart',
    align: 'left'
  },
  labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
};
</script>
