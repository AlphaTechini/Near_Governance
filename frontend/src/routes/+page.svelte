<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchNetworkHealth } from '$lib/api';
  import type { NetworkHealthResponse } from '$lib/types';
  import GRIGauge from '$lib/components/GRIGauge.svelte';
  import ParticipationChart from '$lib/components/ParticipationChart.svelte';

  let health: NetworkHealthResponse | null = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      health = await fetchNetworkHealth();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="space-y-8">
  <!-- Header -->
  <div>
    <h2 class="text-3xl font-bold tracking-tight text-white">Network Overview</h2>
    <p class="mt-2 text-zinc-400">
      Protocol-level governance health and participation metrics.
    </p>
  </div>

  {#if loading}
    <div class="animate-pulse space-y-4">
      <div class="h-32 bg-dark-card rounded-xl"></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="h-64 bg-dark-card rounded-xl"></div>
        <div class="h-64 bg-dark-card rounded-xl"></div>
        <div class="h-64 bg-dark-card rounded-xl"></div>
      </div>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-near-red/10 border border-near-red/20 text-near-red">
      Error loading data: {error}
    </div>
  {:else if health}
    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Median GRI -->
      <div class="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-near-green/5 to-transparent"></div>
        <GRIGauge score={health.medianGRI} size="lg" />
        <p class="mt-4 text-sm text-zinc-400 font-medium">Median Network GRI</p>
      </div>

      <!-- Active DAOs -->
      <div class="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col justify-between">
        <div>
          <p class="text-sm font-medium text-zinc-500 uppercase tracking-wider">Active DAOs</p>
          <p class="mt-2 text-4xl font-bold text-white">{health.activeDAOs}</p>
        </div>
        <div class="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <span class="inline-block w-2 h-2 rounded-full bg-near-green"></span>
          active in last 30d
        </div>
      </div>

      <!-- Total Proposals -->
      <div class="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col justify-between">
        <div>
          <p class="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Proposals</p>
          <p class="mt-2 text-4xl font-bold text-white">{health.totalProposals}</p>
        </div>
        <div class="mt-4 text-sm text-zinc-400">
          Across all tracked DAOs
        </div>
      </div>

      <!-- Total Votes -->
      <div class="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col justify-between">
        <div>
          <p class="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Votes</p>
          <p class="mt-2 text-4xl font-bold text-white">{health.totalVotes}</p>
        </div>
        <div class="mt-4 text-sm text-zinc-400">
          On-chain participation
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Participation Trend -->
      <div class="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 class="text-lg font-semibold text-white mb-6">Participation Trend (7d)</h3>
        <div class="h-64">
          <ParticipationChart data={health.participationTrend} />
        </div>
      </div>

      <!-- Inactive DAOs Stat -->
      <div class="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col justify-center items-center text-center">
        <p class="text-sm font-medium text-zinc-500 uppercase tracking-wider">Inactive / Stale DAOs</p>
        <p class="mt-4 text-6xl font-bold text-zinc-700">{health.inactiveDAOs}</p>
        <p class="mt-4 text-sm text-zinc-400 max-w-[200px]">
          DAOs with no proposals created in the last 30 days.
        </p>
      </div>
    </div>
  {/if}
</div>
