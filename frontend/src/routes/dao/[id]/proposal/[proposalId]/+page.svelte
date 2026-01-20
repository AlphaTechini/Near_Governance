<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { fetchProposal } from "$lib/api";
    import type { Proposal } from "$lib/types";

    let daoId = $page.params.id ?? "";
    let proposalId = $page.params.proposalId ?? "";

    let proposal: Proposal | null = null;
    let participationRate = 0;
    let loading = true;
    let error: string | null = null;
    let memberCount = 0;

    onMount(async () => {
        if (!daoId || !proposalId) {
            error = "Invalid DAO or Proposal ID";
            loading = false;
            return;
        }
        try {
            const res = (await fetchProposal(daoId, proposalId)) as {
                proposal: Proposal;
                participationRate: number;
                memberCount?: number;
            };
            proposal = res.proposal;
            participationRate = res.participationRate;
            memberCount = res.memberCount ?? 0;
        } catch (e) {
            error = (e as Error).message;
        } finally {
            loading = false;
        }
    });

    function getStatusColor(status: string) {
        switch (status) {
            case "Approved":
                return "text-near-green border-near-green/20 bg-near-green/10";
            case "Rejected":
                return "text-near-red border-near-red/20 bg-near-red/10";
            case "InProgress":
                return "text-near-blue border-near-blue/20 bg-near-blue/10";
            default:
                return "text-zinc-400 border-zinc-700 bg-zinc-800";
        }
    }
</script>

<div class="max-w-4xl mx-auto">
    <a
        href="/dao/{daoId}"
        class="inline-flex items-center text-sm text-zinc-500 hover:text-white mb-6 transition-colors"
    >
        ← Back to DAO
    </a>

    {#if loading}
        <div class="animate-pulse space-y-6">
            <div class="h-12 bg-dark-card rounded w-3/4"></div>
            <div class="h-64 bg-dark-card rounded-xl"></div>
        </div>
    {:else if error}
        <div
            class="p-8 text-center bg-dark-card rounded-xl border border-dark-border"
        >
            <p class="text-near-red">{error}</p>
        </div>
    {:else if proposal}
        <div
            class="bg-dark-card border border-dark-border rounded-xl overflow-hidden"
        >
            <!-- Header -->
            <div class="p-6 border-b border-dark-border bg-zinc-900/50">
                <div class="flex items-center justify-between mb-4">
                    <span class="font-mono text-zinc-500">#{proposal.id}</span>
                    <span
                        class="px-3 py-1 rounded-full text-sm font-medium border {getStatusColor(
                            proposal.status,
                        )}"
                    >
                        {proposal.status}
                    </span>
                </div>
                <h1 class="text-2xl font-bold text-white leading-relaxed">
                    {proposal.description || "No description provided"}
                </h1>
                <div class="mt-4 flex items-center gap-6 text-sm text-zinc-400">
                    <div>
                        Proposer: <span
                            class="font-mono text-white bg-zinc-800 px-2 py-0.5 rounded"
                            >{proposal.proposer}</span
                        >
                    </div>
                    <div>
                        Submitted: <span class="text-white"
                            >{new Date(
                                Number(proposal.submissionTime) / 1000000,
                            ).toLocaleString()}</span
                        >
                    </div>
                </div>
            </div>

            <!-- Voting Stats -->
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Participation -->
                <div class="col-span-1 border-r border-dark-border pr-6">
                    <h3
                        class="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4"
                    >
                        Participation
                    </h3>
                    <div class="flex items-end gap-2">
                        <span class="text-4xl font-bold text-white"
                            >{participationRate}%</span
                        >
                        <span class="text-sm text-zinc-500 mb-1"
                            >of members</span
                        >
                    </div>
                    <div
                        class="mt-2 w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
                    >
                        <div
                            class="h-full bg-near-blue transition-all"
                            style="width: {participationRate}%"
                        ></div>
                    </div>
                    <p class="mt-2 text-xs text-zinc-500">
                        {Object.keys(proposal.votes).length} votes cast out of {memberCount}
                        eligible
                    </p>
                </div>

                <!-- Vote Breakdown -->
                <div class="col-span-2 space-y-4">
                    <h3
                        class="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2"
                    >
                        Vote Breakdown
                    </h3>

                    <!-- Approve -->
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-near-green">Approve</span>
                            <span class="text-white font-mono"
                                >{proposal.voteCount.approve}</span
                            >
                        </div>
                        <div
                            class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-near-green"
                                style="width: {(proposal.voteCount.approve /
                                    (Object.keys(proposal.votes).length || 1)) *
                                    100}%"
                            ></div>
                        </div>
                    </div>

                    <!-- Reject -->
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-near-red">Reject</span>
                            <span class="text-white font-mono"
                                >{proposal.voteCount.reject}</span
                            >
                        </div>
                        <div
                            class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-near-red"
                                style="width: {(proposal.voteCount.reject /
                                    (Object.keys(proposal.votes).length || 1)) *
                                    100}%"
                            ></div>
                        </div>
                    </div>

                    <!-- Remove -->
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-near-yellow">Remove</span>
                            <span class="text-white font-mono"
                                >{proposal.voteCount.remove}</span
                            >
                        </div>
                        <div
                            class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-near-yellow"
                                style="width: {(proposal.voteCount.remove /
                                    (Object.keys(proposal.votes).length || 1)) *
                                    100}%"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Voter List -->
            <div class="border-t border-dark-border">
                <div
                    class="p-4 bg-zinc-900/30 font-medium text-zinc-400 text-sm uppercase tracking-wider border-b border-dark-border"
                >
                    Cast Votes ({Object.keys(proposal.votes).length})
                </div>
                <div class="max-h-96 overflow-y-auto">
                    {#each Object.entries(proposal.votes) as [voter, vote]}
                        <div
                            class="flex items-center justify-between p-4 border-b border-dark-border last:border-0 hover:bg-zinc-900/50 transition-colors"
                        >
                            <span class="font-mono text-sm text-zinc-300"
                                >{voter}</span
                            >
                            <span
                                class="text-xs font-medium px-2 py-1 rounded bg-zinc-800
                {vote === 'Approve'
                                    ? 'text-near-green'
                                    : vote === 'Reject'
                                      ? 'text-near-red'
                                      : 'text-zinc-400'}"
                            >
                                {vote}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="mt-8 bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 class="text-lg font-bold text-white mb-4">Raw JSON Data</h3>
            <pre
                class="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs text-zinc-500 font-mono">
{JSON.stringify(proposal, null, 2)}
      </pre>
        </div>
    {/if}
</div>
