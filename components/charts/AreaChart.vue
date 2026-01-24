<template>
  <div>
    <apexchart
      type="area"
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

const series = [{
  name: 'Series 1',
  data: [31, 40, 28, 51, 42, 109, 100]
}, {
  name: 'Series 2',
  data: [11, 32, 45, 32, 34, 52, 41]
}];

const chartOptions = {
  chart: {
    height: 350,
    type: 'area',
    toolbar: {
      show: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  title: {
    text: props.title || 'Area Chart',
    align: 'left'
  },
  xaxis: {
    type: 'datetime',
    categories: [
      '2024-01-19T00:00:00.000Z',
      '2024-01-19T01:30:00.000Z',
      '2024-01-19T02:30:00.000Z',
      '2024-01-19T03:30:00.000Z',
      '2024-01-19T04:30:00.000Z',
      '2024-01-19T05:30:00.000Z',
      '2024-01-19T06:30:00.000Z'
    ]
  },
  tooltip: {
    x: {
      format: 'dd/MM/yy HH:mm'
    }
  }
};
</script>
