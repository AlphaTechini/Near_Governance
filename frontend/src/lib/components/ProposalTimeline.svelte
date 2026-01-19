<script lang="ts">
  import type { Proposal } from '$lib/types';

  export let recentProposals: Proposal[] = [];

  function getStatusColor(status: string) {
    switch (status) {
      case 'Approved': return 'bg-near-green/10 text-near-green border-near-green/20';
      case 'Rejected': return 'bg-near-red/10 text-near-red border-near-red/20';
      case 'InProgress': return 'bg-near-blue/10 text-near-blue border-near-blue/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  }

  function formatTime(nanoseconds: string) {
    const ms = Number(nanoseconds) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="relative pl-6 border-l border-dark-border space-y-8">
  {#each recentProposals as proposal (proposal.id)}
    <div class="relative">
      <!-- Dot -->
      <div class="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-dark-bg 
        {proposal.status === 'Approved' ? 'bg-near-green' : 
         proposal.status === 'InProgress' ? 'bg-near-blue' : 
         proposal.status === 'Rejected' ? 'bg-near-red' : 'bg-zinc-600'}">
      </div>

      <!-- Content -->
      <a href="/dao/{proposal.daoId}/proposal/{proposal.id}" class="block group">
        <div class="flex items-start justify-between">
          <div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border {getStatusColor(proposal.status)}">
              {proposal.status}
            </span>
            <span class="ml-2 text-xs text-zinc-500">#{proposal.id}</span>
          </div>
          <time class="text-xs text-zinc-600 font-mono">
            {formatTime(proposal.submissionTime)}
          </time>
        </div>
        
        <p class="mt-2 text-sm text-zinc-300 group-hover:text-white transition-colors line-clamp-2">
          {proposal.description || 'No description provided'}
        </p>
        
        <div class="mt-2 flex items-center gap-4 text-xs text-zinc-500">
          <div class="flex items-center gap-1">
            <span class="text-zinc-400 font-medium">{proposal.voteCount.approve}</span> Approve
          </div>
          <div class="flex items-center gap-1">
            <span class="text-zinc-400 font-medium">{proposal.voteCount.reject}</span> Reject
          </div>
          <div class="flex items-center gap-1 ml-auto">
            by <span class="text-zinc-400 font-mono truncate max-w-[100px]">{proposal.proposer}</span>
          </div>
        </div>
      </a>
    </div>
  {/each}
</div>
