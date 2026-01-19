<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { fetchDAOOverview } from "$lib/api";
    import type { DAOOverviewResponse } from "$lib/types";
    import GRIGauge from "$lib/components/GRIGauge.svelte";
    import ProposalTimeline from "$lib/components/ProposalTimeline.svelte";

    let daoId = "";
    // Update daoId when page params change
    $: daoId = $page.params.id;

    let data: DAOOverviewResponse | null = null;
    let loading = true;
    let error: string | null = null;

    // React to daoId changes
    $: if (daoId) loadData(daoId);

    async function loadData(id: string) {
        loading = true;
        error = null;
        try {
            data = await fetchDAOOverview(id);
        } catch (e) {
            error = (e as Error).message;
        } finally {
            loading = false;
        }
    }
</script>

{#if loading}
    <div class="animate-pulse space-y-6">
        <div class="h-24 bg-dark-card rounded-xl w-1/2"></div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="h-48 bg-dark-card rounded-xl md:col-span-2"></div>
            <div class="h-48 bg-dark-card rounded-xl"></div>
            <div class="h-48 bg-dark-card rounded-xl"></div>
        </div>
        <div class="h-96 bg-dark-card rounded-xl"></div>
    </div>
{:else if error}
    <div class="p-8 text-center">
        <div
            class="inline-block p-4 rounded-full bg-near-red/10 text-near-red text-xl mb-4"
        >
            ⚠️
        </div>
        <h3 class="text-xl font-bold text-white">Failed to load DAO</h3>
        <p class="mt-2 text-zinc-400">{error}</p>
        <a
            href="/"
            class="mt-4 inline-block px-4 py-2 rounded bg-zinc-800 text-white hover:bg-zinc-700"
            >Go Back</a
        >
    </div>
{:else if data}
    <div class="space-y-8">
        <!-- DAO Header -->
        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-3xl font-bold text-white">
                        {data.dao.name}
                    </h1>
                    <span
                        class="px-2 py-1 rounded text-xs font-mono bg-zinc-800 text-zinc-400"
                    >
                        {data.dao.id}
                    </span>
                </div>
                <p class="mt-2 text-zinc-400">
                    Last active: {data.dao.lastActivityAt
                        ? new Date(
                              Number(data.dao.lastActivityAt) / 1000000,
                          ).toLocaleDateString()
                        : "Never"}
                </p>
            </div>
            <div class="flex gap-4">
                <a
                    href="https://nearblocks.io/address/{data.dao.contractId}"
                    target="_blank"
                    class="px-4 py-2 rounded-lg bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
                >
                    View on Explorer ↗
                </a>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- GRI Score Card -->
            <div
                class="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-6 relative overflow-hidden"
            >
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <span class="text-9xl font-bold text-white">GRI</span>
                </div>
                <div
                    class="relative z-10 flex flex-col items-center text-center"
                >
                    <GRIGauge score={data.gri.overall} size="lg" />

                    <div class="mt-8 w-full space-y-4">
                        <h4
                            class="text-sm font-medium text-zinc-500 uppercase tracking-wider text-left"
                        >
                            Score Breakdown
                        </h4>

                        <!-- Breakdown Items -->
                        <div class="space-y-3">
                            {#each Object.entries(data.gri.breakdown) as [key, metric]}
                                <div class="group relative">
                                    <div
                                        class="flex justify-between items-center text-sm"
                                    >
                                        <span class="text-zinc-400 capitalize"
                                            >{key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}</span
                                        >
                                        <span
                                            class="font-mono text-white font-medium"
                                            >{metric.score}</span
                                        >
                                    </div>
                                    <div
                                        class="mt-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"
                                    >
                                        <div
                                            class="h-full rounded-full transition-all duration-500 {metric.score >=
                                            80
                                                ? 'bg-near-green'
                                                : metric.score >= 50
                                                  ? 'bg-near-yellow'
                                                  : 'bg-near-red'}"
                                            style="width: {metric.score}%"
                                        ></div>
                                    </div>
                                    <!-- Tooltip -->
                                    <div
                                        class="hidden group-hover:block absolute bottom-full left-0 w-full mb-2 p-2 bg-black border border-dark-border rounded text-xs text-zinc-300 z-20"
                                    >
                                        {metric.description}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats & Timeline -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Key Stats -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div
                        class="bg-dark-card border border-dark-border rounded-xl p-4"
                    >
                        <p class="text-xs text-zinc-500 uppercase">Members</p>
                        <p class="text-2xl font-bold text-white mt-1">
                            {data.memberCount}
                        </p>
                    </div>
                    <div
                        class="bg-dark-card border border-dark-border rounded-xl p-4"
                    >
                        <p class="text-xs text-zinc-500 uppercase">
                            Active (30d)
                        </p>
                        <p class="text-2xl font-bold text-white mt-1">
                            {data.activeMembers}
                        </p>
                    </div>
                    <div
                        class="bg-dark-card border border-dark-border rounded-xl p-4"
                    >
                        <p class="text-xs text-zinc-500 uppercase">Proposals</p>
                        <p class="text-2xl font-bold text-white mt-1">
                            {data.recentProposals.length}
                        </p>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div
                    class="bg-dark-card border border-dark-border rounded-xl p-6"
                >
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-white">
                            Recent Proposals
                        </h3>
                        <a
                            href="/dao/{data.dao.id}/proposals"
                            class="text-sm text-near-green hover:underline"
                            >View All</a
                        >
                    </div>

                    <ProposalTimeline recentProposals={data.recentProposals} />
                </div>
            </div>
        </div>
    </div>
{/if}
