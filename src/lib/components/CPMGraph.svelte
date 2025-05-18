<script lang="ts">
  import { onMount } from 'svelte';
  import type { Task, CPMResult } from '$lib/types/project';
  
  export let tasks: Task[] = [];
  export let cpmResults: Record<string, CPMResult> = {};
  export let criticalPath: string[] = [];
  
  let container: HTMLElement;
  
  onMount(() => {
    if (tasks.length > 0 && Object.keys(cpmResults).length > 0) {
      drawGraph();
    }
  });
  
  function drawGraph() {
    // Podstawowa implementacja - w pełnej wersji tutaj byłoby użycie d3.js lub podobnej biblioteki
    container.innerHTML = '';
    
    const element = document.createElement('div');
    element.className = 'network-diagram-placeholder';
    element.textContent = 'Network diagram visualization would be rendered here using D3.js or similar library';
    
    container.appendChild(element);
  }
  
  $: if (tasks && cpmResults && container) {
    drawGraph();
  }
</script>

<div class="cpm-graph">
  <h3>Network Diagram</h3>
  
  {#if tasks.length === 0}
    <p>Add tasks to see the network diagram.</p>
  {:else if Object.keys(cpmResults).length === 0}
    <p>Calculate CPM to see the network diagram.</p>
  {:else}
    <div class="network-diagram" bind:this={container}></div>
    
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color critical"></div>
        <span>Critical Path</span>
      </div>
      <div class="legend-item">
        <div class="legend-color normal"></div>
        <span>Regular Task</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .cpm-graph {
    margin-bottom: 1.5rem;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .network-diagram {
    width: 100%;
    min-height: 300px;
    border: 1px solid #ddd;
    margin-bottom: 1rem;
  }
  
  .network-diagram-placeholder {
    width: 100%;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f9f9f9;
    color: #666;
    text-align: center;
    padding: 1rem;
  }
  
  .legend {
    display: flex;
    gap: 1rem;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .legend-color {
    width: 20px;
    height: 10px;
  }
  
  .critical {
    background-color: #e74c3c;
  }
  
  .normal {
    background-color: #3498db;
  }
</style>
