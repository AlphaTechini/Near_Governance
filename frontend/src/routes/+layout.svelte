<script lang="ts">
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import { onMount } from "svelte";
  import "../app.css";
  import { page } from "$app/stores";
  import { fetchDAOs } from "$lib/api";
  import type { DAO } from "$lib/types";

  let { children } = $props();

  let activeDAOs = $state<DAO[]>([]);
  let loadingDAOs = $state(true);

  const CURATED_DAOS = [
    "marketing.sputnik-dao.near",
    "news.sputnik-dao.near",
    "marmaj.sputnik-dao.near",
    "nxm.sputnik-dao.near",
    "ref-finance.sputnik-dao.near",
    "creatives.sputnik-dao.near",
    "hak.sputnik-dao.near",
    "community.sputnik-dao.near",
    "openshards.sputnik-dao.near",
    "thekindao.sputnik-dao.near",
    "croncat.sputnik-dao.near",
    "onboarding-dao.sputnik-dao.near",
  ];

  onMount(async () => {
    injectAnalytics();
    // Ping backend to prevent cold start
    fetch("https://near-governance.onrender.com").catch((e) => {
      console.debug("Backend ping failed", e);
    });

    // Fetch DAOs and filter to curated active ones
    try {
      const res = await fetchDAOs();
      activeDAOs = res.daos.filter(
        (dao) => CURATED_DAOS.includes(dao.id) && dao.proposalCount > 0,
      );
    } catch (e) {
      console.error("Failed to fetch DAOs for sidebar", e);
    } finally {
      loadingDAOs = false;
    }
  });
</script>

<div class="flex min-h-screen flex-col md:flex-row bg-dark-bg text-gray-100">
  <!-- Sidebar Navigation -->
  <aside
    class="w-full md:w-64 border-r border-dark-border bg-dark-card flex-shrink-0"
  >
    <div class="p-6">
      <h1
        class="text-xl font-bold tracking-tight text-white flex items-center gap-2"
      >
        <span class="text-near-green text-2xl">●</span> GRI
      </h1>
      <p class="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-mono">
        Governance Reality<br />Index
      </p>
    </div>

    <nav class="mt-6 px-4 space-y-1">
      <a
        href="/"
        class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors {$page
          .url.pathname === '/'
          ? 'bg-near-green/10 text-near-green'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}"
      >
        Network Overview
      </a>

      <div
        class="pt-6 pb-2 px-4 text-xs font-semibold text-zinc-600 uppercase tracking-widest"
      >
        Active DAOs
      </div>

      {#if loadingDAOs}
        <div class="px-4 py-2 text-sm text-zinc-600 animate-pulse">
          Loading...
        </div>
      {:else if activeDAOs.length === 0}
        <div class="px-4 py-2 text-sm text-zinc-600">No active DAOs found</div>
      {:else}
        {#each activeDAOs as dao (dao.id)}
          <a
            href="/dao/{dao.id}"
            class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors {$page.url.pathname.includes(
              dao.id,
            )
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300'}"
          >
            {dao.name}
          </a>
        {/each}
      {/if}
    </nav>

    <div class="absolute bottom-6 left-6 right-6">
      <div class="text-[10px] text-zinc-700 font-mono">
        v1.0.0-mvp<br />
        NEAR Protocol
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 min-w-0 overflow-y-auto">
    <div class="max-w-6xl mx-auto p-6 md:p-12">
      {@render children()}
    </div>
  </main>
</div>
