<template>
  <div>
    <apexchart
      type="treemap"
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

const series = [
  {
    data: [
      {
        x: 'New Delhi',
        y: 218
      },
      {
        x: 'Kolkata',
        y: 149
      },
      {
        x: 'Mumbai',
        y: 184
      },
      {
        x: 'Ahmedabad',
        y: 55
      },
      {
        x: 'Bangaluru',
        y: 84
      },
      {
        x: 'Pune',
        y: 31
      },
      {
        x: 'Chennai',
        y: 70
      },
      {
        x: 'Jaipur',
        y: 30
      },
      {
        x: 'Surat',
        y: 44
      }
    ]
  }
];

const chartOptions = {
  legend: {
    show: false
  },
  chart: {
    height: 350,
    type: 'treemap',
    toolbar: {
      show: false
    }
  },
  title: {
    text: props.title || 'Treemap Chart',
    align: 'left'
  }
};
</script>
