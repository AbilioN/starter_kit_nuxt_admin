<template>
  <div>
    <apexchart
      type="radar"
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
  data: [80, 50, 30, 40, 100, 20]
}, {
  name: 'Series 2',
  data: [20, 30, 40, 80, 20, 80]
}];

const chartOptions = {
  chart: {
    height: 350,
    type: 'radar',
    toolbar: {
      show: false
    }
  },
  title: {
    text: props.title || 'Radar Chart',
    align: 'left'
  },
  xaxis: {
    categories: ['January', 'February', 'March', 'April', 'May', 'June']
  }
};
</script>
