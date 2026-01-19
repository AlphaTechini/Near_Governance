<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Filler,
  } from 'chart.js';
  import type { TrendPoint } from '$lib/types';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Filler
  );

  export let data: TrendPoint[] = [];

  $: chartData = {
    labels: data.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Participation Score',
        fill: true,
        lineTension: 0.3,
        backgroundColor: 'rgba(0, 236, 151, 0.05)',
        borderColor: '#00EC97',
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: '#00EC97',
        pointBackgroundColor: '#111111',
        pointBorderWidth: 2,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#00EC97',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        pointRadius: 4,
        pointHitRadius: 10,
        data: data.map(d => d.value),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1C1C1C',
        titleColor: '#fff',
        bodyColor: '#A1A1AA',
        borderColor: '#2A2A2A',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Score: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#52525B',
          font: {
            family: 'Inter',
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: '#2A2A2A',
          drawBorder: false,
        },
        ticks: {
          color: '#52525B',
          font: {
            family: 'Inter',
            size: 10,
          },
        },
        min: 0,
        suggestedMax: 100,
      },
    },
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
</script>

<div class="w-full h-full min-h-[250px]">
  <!-- @ts-ignore -->
  <Line data={chartData} {options} />
</div>
