<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Task, CPMResult } from '$lib/types/project';

  export let tasks: Task[] = [];
  export let cpmResults: Record<string, CPMResult> = {};
  export let showCPMResults: boolean = false;

  const dispatch = createEventDispatcher<{
    edit: { taskId: string };
    delete: { taskId: string };
  }>();

  // Handle edit button click
  function handleEdit(taskId: string) {
    dispatch('edit', { taskId });
  }

  // Handle delete button click
  function handleDelete(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      dispatch('delete', { taskId });
    }
  }

  // Get task dependency names for display
  function getDependencyNames(dependencies: string[]): string {
    if (dependencies.length === 0) return 'None';
    
    return dependencies
      .map(id => tasks.find(task => task.id === id)?.name || id)
      .join(', ');
  }

  // Get tasks with dependency info for display
  $: tasksWithDependencies = tasks.map(task => ({
    ...task,
    dependencyNames: getDependencyNames(task.dependencies)
  }));
</script>

<div class="task-list-container">
  {#if tasks.length === 0}
    <div class="empty-state">
      <p>No tasks added yet. Use the form above to add tasks to your project.</p>
    </div>
  {:else}
    <table class="task-list">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Duration</th>
          <th>Dependencies</th>
          {#if showCPMResults}
            <th>ES</th>
            <th>EF</th>
            <th>LS</th>
            <th>LF</th>
            <th>Slack</th>
            <th>Critical</th>
          {/if}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each tasksWithDependencies as task (task.id)}
          <tr class:critical={showCPMResults && cpmResults[task.id]?.isCritical}>
            <td>{task.name}</td>
            <td class="description">{task.description || '—'}</td>
            <td class="duration">{task.duration} days</td>
            <td>{task.dependencyNames}</td>
            
            {#if showCPMResults}
              {#if cpmResults[task.id]}
                <td>{cpmResults[task.id].earliestStart}</td>
                <td>{cpmResults[task.id].earliestFinish}</td>
                <td>{cpmResults[task.id].latestStart}</td>
                <td>{cpmResults[task.id].latestFinish}</td>
                <td>{cpmResults[task.id].slack}</td>
                <td>
                  {#if cpmResults[task.id].isCritical}
                    <span class="critical-badge">Yes</span>
                  {:else}
                    No
                  {/if}
                </td>
              {:else}
                <td colspan="6" class="no-results">No CPM results available</td>
              {/if}
            {/if}
            
            <td class="actions">
              <button 
                class="btn-edit"
                on:click={() => handleEdit(task.id)}
                title="Edit task"
              >
                Edit
              </button>
              <button 
                class="btn-delete"
                on:click={() => handleDelete(task.id)}
                title="Delete task"
              >
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    
    <div class="table-info">
      <p>Total tasks: {tasks.length}</p>
      {#if showCPMResults}
        <p>
          Critical tasks: 
          {tasks.filter(task => cpmResults[task.id]?.isCritical).length}
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .task-list-container {
    margin-bottom: 2rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    color: #666;
  }
  
  .task-list {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }
  
  tr:hover {
    background-color: #f8f9fa;
  }
  
  tr.critical {
    background-color: #fff3cd;
  }
  
  tr.critical:hover {
    background-color: #ffe8b3;
  }
  
  .description {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .duration {
    text-align: center;
  }
  
  .actions {
    white-space: nowrap;
  }
  
  .btn-edit, .btn-delete {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    margin-right: 0.25rem;
  }
  
  .btn-edit {
    background-color: #6c757d;
    color: white;
  }
  
  .btn-edit:hover {
    background-color: #5a6268;
  }
  
  .btn-delete {
    background-color: #dc3545;
    color: white;
  }
  
  .btn-delete:hover {
    background-color: #c82333;
  }
  
  .critical-badge {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background-color: #dc3545;
    color: white;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .table-info {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #6c757d;
  }
  
  .no-results {
    font-style: italic;
    color: #6c757d;
  }
</style>