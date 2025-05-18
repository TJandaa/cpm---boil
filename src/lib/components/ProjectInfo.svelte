<script lang="ts">
  import type { Project } from '$lib/types/project';
  
  export let project: Project | null = null;
</script>

{#if project}
  <div class="project-info">
    <h2>{project.name}</h2>
    {#if project.description}
      <p class="description">{project.description}</p>
    {/if}
    <div class="stats">
      <div class="stat">
        <span class="label">Tasks:</span>
        <span class="value">{project.tasks.length}</span>
      </div>
    </div>
  </div>
{:else}
  <div class="project-info empty">
    <p>No project selected. Create a new project or select an existing one.</p>
  </div>
{/if}

<style>
  .project-info {
    margin-bottom: 1.5rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
  
  .project-info.empty {
    color: #666;
    font-style: italic;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .description {
    margin-bottom: 1rem;
    color: #555;
  }
  
  .stats {
    display: flex;
    gap: 1rem;
  }
  
  .stat {
    display: flex;
    gap: 0.5rem;
  }
  
  .label {
    font-weight: bold;
  }
</style>
