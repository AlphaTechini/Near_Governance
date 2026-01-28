<script lang="ts">
    import { page } from "$app/stores";
    import { fetchDAOProposals } from "$lib/api";
    import type { Proposal } from "$lib/types";
    import ProposalTimeline from "$lib/components/ProposalTimeline.svelte";

    let daoId = "";
    $: daoId = $page.params.id ?? "";

    let proposals: Proposal[] = [];
    let loading = true;
    let error: string | null = null;
    let totalCount = 0;

    $: if (daoId) loadProposals(daoId);

    async function loadProposals(id: string) {
        loading = true;
        error = null;
        try {
            const res = await fetchDAOProposals(id);
            proposals = res.proposals;
            totalCount = res.totalCount;
        } catch (e) {
            error = (e as Error).message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <a
                href="/dao/{daoId}"
                class="text-sm text-near-green hover:underline mb-2 inline-block"
                >← Back to Overview</a
            >
            <h2 class="text-3xl font-bold text-white">All Proposals</h2>
            <p class="text-zinc-400 mt-1">
                Found {totalCount} proposals for {daoId}
            </p>
        </div>
    </div>

    {#if loading}
        <div class="animate-pulse space-y-4">
            {#each Array(5) as _}
                <div class="h-24 bg-dark-card rounded-xl"></div>
            {/each}
        </div>
    {:else if error}
        <div
            class="p-4 rounded-lg bg-near-red/10 border border-near-red/20 text-near-red"
        >
            Error loading proposals: {error}
        </div>
    {:else}
        <div class="bg-dark-card border border-dark-border rounded-xl p-6">
            <ProposalTimeline recentProposals={proposals} />
        </div>
    {/if}
</div>
