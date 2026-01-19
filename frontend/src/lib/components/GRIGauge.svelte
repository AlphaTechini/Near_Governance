<script lang="ts">
  import { onMount } from 'svelte';
  
  export let score: number = 0;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showLabel: boolean = true;
  
  // Color scale based on score
  $: color = score >= 80 ? 'text-near-green' :
             score >= 60 ? 'text-blue-400' :
             score >= 40 ? 'text-near-yellow' :
             'text-near-red';
             
  $: ringColor = score >= 80 ? 'stroke-near-green' :
                 score >= 60 ? 'stroke-blue-400' :
                 score >= 40 ? 'stroke-near-yellow' :
                 'stroke-near-red';
                 
  $: sizes = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  }[size];
  
  $: strokeDasharray = `${score}, 100`;
</script>

<div class="flex flex-col items-center justify-center">
  <div class="relative {sizes} flex items-center justify-center">
    <!-- Background Ring -->
    <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
      <path
        class="text-dark-border stroke-current"
        stroke-width="3"
        fill="none"
        d="M18 2.0845
           a 15.9155 15.9155 0 0 1 0 31.831
           a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <!-- Value Ring -->
      <path
        class="{ringColor} stroke-current transition-all duration-1000 ease-out"
        stroke-width="3"
        stroke-dasharray={strokeDasharray}
        fill="none"
        stroke-linecap="round"
        d="M18 2.0845
           a 15.9155 15.9155 0 0 1 0 31.831
           a 15.9155 15.9155 0 0 1 0 -31.831"
      />
    </svg>
    
    <!-- Score Value -->
    <div class="absolute inset-0 flex items-center justify-center font-bold {color}">
      {Math.round(score)}
    </div>
  </div>
  
  {#if showLabel}
    <div class="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
      GRI Score
    </div>
  {/if}
</div>
