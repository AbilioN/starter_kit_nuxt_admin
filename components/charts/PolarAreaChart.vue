<template>
  <div>
    <apexchart
      type="polarArea"
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

const series = [14, 23, 21, 17, 15, 10, 12, 17, 21];

const chartOptions = {
  chart: {
    type: 'polarArea'
  },
  title: {
    text: props.title || 'Polar Area Chart',
    align: 'left'
  },
  stroke: {
    colors: ['#fff']
  },
  fill: {
    opacity: 0.8
  },
  labels: ['Series 1', 'Series 2', 'Series 3', 'Series 4', 'Series 5', 'Series 6', 'Series 7', 'Series 8', 'Series 9'],
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
