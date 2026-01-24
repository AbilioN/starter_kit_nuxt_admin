<template>
  <div>
    <apexchart
      type="line"
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
  name: 'Sales',
  data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
}, {
  name: 'Revenue',
  data: [20, 30, 25, 40, 39, 50, 60, 81, 115]
}];

const chartOptions = {
  chart: {
    height: 350,
    type: 'line',
    toolbar: {
      show: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  title: {
    text: props.title || 'Line Chart',
    align: 'left'
  },
  grid: {
    borderColor: '#e7e7e7',
    row: {
      colors: ['#f3f3f3', 'transparent'],
      opacity: 0.5
    }
  },
  markers: {
    size: 1
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  },
  yaxis: {
    title: {
      text: 'Value'
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    floating: true,
    offsetY: -25,
    offsetX: -5
  }
};
</script>
