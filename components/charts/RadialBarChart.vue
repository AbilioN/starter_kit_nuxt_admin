<template>
  <div>
    <apexchart
      type="radialBar"
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

const series = [76, 67, 61, 90];

const chartOptions = {
  chart: {
    height: 350,
    type: 'radialBar'
  },
  title: {
    text: props.title || 'Radial Bar Chart',
    align: 'left'
  },
  plotOptions: {
    radialBar: {
      offsetY: 0,
      startAngle: 0,
      endAngle: 270,
      hollow: {
        margin: 5,
        size: '30%',
        background: 'transparent',
        image: undefined
      },
      dataLabels: {
        name: {
          show: false
        },
        value: {
          show: false
        }
      }
    }
  },
  colors: ['#1ab7ea', '#0084ff', '#39539E', '#0077B5'],
  labels: ['Vimeo', 'Messenger', 'Facebook', 'LinkedIn'],
  legend: {
    show: true,
    floating: true,
    fontSize: '16px',
    position: 'left',
    offsetX: 160,
    offsetY: 15,
    labels: {
      useSeriesColors: true
    },
    markers: {
      size: 0
    },
    formatter: (seriesName: string, opts: any) => {
      return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex]
    },
    itemMargin: {
      vertical: 3
    }
  }
};
</script>
