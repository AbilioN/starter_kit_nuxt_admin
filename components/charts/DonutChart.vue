<template>
  <div>
    <apexchart
      type="donut"
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

const series = [44, 55, 41, 17, 15];

const chartOptions = {
  chart: {
    type: 'donut'
  },
  title: {
    text: props.title || 'Donut Chart',
    align: 'left'
  },
  labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
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
  }],
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            fontSize: '22px',
            fontWeight: 600
          }
        }
      }
    }
  }
};
</script>
