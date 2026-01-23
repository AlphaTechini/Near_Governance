<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import { page } from "$app/stores";

  let { children } = $props();

  onMount(() => {
    // Ping backend to prevent cold start
    fetch("https://near-governance.onrender.com").catch((e) => {
      console.debug("Backend ping failed", e);
    });
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

      <!-- Hardcoded for MVP, would be dynamic list in real app -->
      <a
        href="/dao/sputnik-dao.near"
        class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors {$page.url.pathname.includes(
          'sputnik-dao.near',
        )
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-500 hover:text-zinc-300'}"
      >
        Sputnik DAO
      </a>
      <a
        href="/dao/marketing.sputnik-dao.near"
        class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors {$page.url.pathname.includes(
          'marketing',
        )
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-500 hover:text-zinc-300'}"
      >
        Marketing DAO
      </a>
      <a
        href="/dao/devhub.sputnik-dao.near"
        class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors {$page.url.pathname.includes(
          'devhub',
        )
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-500 hover:text-zinc-300'}"
      >
        DevHub
      </a>
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
