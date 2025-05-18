<script lang="ts">
  import { Task, ProjectCPMResults } from '$lib/types/project';
  import { createEventDispatcher } from 'svelte';

  export let projectName: string = 'Untitled Project';
  export let tasks: Task[] = [];
  export let cpmResults: ProjectCPMResults | null = null;
  export let editable: boolean = true; // Whether project name can be edited

  let editMode = false;
  let editedName = projectName;

  const dispatch = createEventDispatcher<{
    nameChange: { name: string };
  }>();

  // Track number of tasks on the critical path
  $: criticalPathTasks = cpmResults?.criticalPath.length || 0;
  
  // Calculate total project duration including non-critical tasks
  $: totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
  
  // Calculate critical path duration
  $: criticalPathDuration = cpmResults?.projectDuration || 0;
  
  // Calculate efficiency ratio (critical path duration / total of all task durations)
  $: efficiencyRatio = totalDuration > 0 
    ? Math.round((criticalPathDuration / totalDuration) * 100) 
    : 0;

  // Calculate theoretical min duration (longest single task)
  $: theoreticalMinDuration = tasks.length > 0
    ? Math.max(...tasks.map(t => t.duration))
    : 0;

  // Enter edit mode for project name
  function startEdit() {
    if (!editable) return;
    editMode = true;
    editedName = projectName;
  }

  // Save edited project name
  function saveProjectName() {
    if (editedName.trim()) {
      dispatch('nameChange', { name: editedName.trim() });
    } else {
      editedName = projectName; // Revert to original if empty
    }
    editMode = false;
  }

  // Cancel editing
  function cancelEdit() {
    editedName = projectName;
    editMode = false;
  }

  // Handle pressing Enter to save
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      saveProjectName();
    } else if (event.key === 'Escape') {
      cancelEdit();
    }
  }
</script>

<div class="project-info">
  <div class="project-header">
    {#if editMode}
      <div class="edit-project-name">
        <input
          type="text"
          bind:value={editedName}
          on:keydown={handleKeyDown}
          on:blur={saveProjectName}
          autofocus
        />
        <div class="edit-actions">
          <button class="btn-save" on:click={saveProjectName} title="Save">✓</button>
          <button class="btn-cancel" on:click={cancelEdit} title="Cancel">✕</button>
        </div>
      </div>
    {:else}
      <h2 
        class:editable
        on:click={startEdit}
        title={editable ? "Click to edit project name" : ""}
      >
        {projectName} 
        {#if editable}
          <span class="edit-icon">✎</span>
        {/if}
      </h2>
    {/if}
  </div>
  
  <div class="project-stats">
    <div class="stat-grid">
      <div class="stat-item">
        <div class="stat-label">Tasks</div>
        <div class="stat-value">{tasks.length}</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">Critical Tasks</div>
        <div class="stat-value">{criticalPathTasks}</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">Project Duration</div>
        <div class="stat-value">{criticalPathDuration} days</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">Total Work</div>
        <div class="stat-value">{totalDuration} days</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">Efficiency Ratio</div>
        <div class="stat-value">{efficiencyRatio}%</div>
        <div class="stat-note">Lower % means more parallel work</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">Min Possible Duration</div>
        <div class="stat-value">{theoreticalMinDuration} days</div>
        <div class="stat-note">Longest single task</div>
      </div>
    </div>
    
    {#if !cpmResults}
      <div class="no-cpm-results">
        <p>Calculate CPM to see detailed project statistics</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .project-info {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .project-header {
    margin-bottom: 1.5rem;
  }
  
  h2 {
    margin: 0;
    color: #333;
    font-size: 1.75rem;
  }
  
  h2.editable {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }
  
  h2.editable:hover {
    color: #3b5998;
  }
  
  .edit-icon {
    font-size: 1rem;
    margin-left: 0.5rem;
    opacity: 0.6;
  }
  
  h2.editable:hover .edit-icon {
    opacity: 1;
  }
  
  .edit-project-name {
    display: flex;
    align-items: center;
  }
  
  .edit-project-name input {
    flex: 1;
    font-size: 1.5rem;
    padding: 0.5rem;
    border: 2px solid #3b5998;
    border-radius: 4px;
    font-weight: 600;
  }
  
  .edit-actions {
    display: flex;
    margin-left: 0.5rem;
  }
  
  .btn-save, .btn-cancel {
    border: none;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-left: 0.25rem;
  }
  
  .btn-save {
    background-color: #28a745;
    color: white;
  }
  
  .btn-cancel {
    background-color: #dc3545;
    color: white;
  }
  
  .project-stats {
    position: relative;
  }
  
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-item {
    background-color: #f8f9fa;
    border-radius: 6px;
    padding: 1rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .stat-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #555;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #3b5998;
  }
  
  .stat-note {
    font-size: 0.75rem;
    color: #6c757d;
    margin-top: 0.25rem;
  }
  
  .no-cpm-results {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }
  
  .no-cpm-results p {
    background-color: #3b5998;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 480px) {
    .stat-grid {
      grid-template-columns: 1fr;
    }
  }
</style>