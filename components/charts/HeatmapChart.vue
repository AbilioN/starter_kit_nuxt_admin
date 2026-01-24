<template>
  <div>
    <apexchart
      type="heatmap"
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

const generateData = (count: number, yrange: { min: number; max: number }) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min);
  }
  return data;
};

const series = [
  {
    name: 'Metric1',
    data: generateData(18, { min: 0, max: 90 })
  },
  {
    name: 'Metric2',
    data: generateData(18, { min: 0, max: 90 })
  },
  {
    name: 'Metric3',
    data: generateData(18, { min: 0, max: 90 })
  },
  {
    name: 'Metric4',
    data: generateData(18, { min: 0, max: 90 })
  },
  {
    name: 'Metric5',
    data: generateData(18, { min: 0, max: 90 })
  }
];

const chartOptions = {
  chart: {
    height: 350,
    type: 'heatmap',
    toolbar: {
      show: false
    }
  },
  title: {
    text: props.title || 'Heatmap Chart',
    align: 'left'
  },
  dataLabels: {
    enabled: false
  },
  colors: ['#008FFB'],
  xaxis: {
    type: 'category'
  }
};
</script>
