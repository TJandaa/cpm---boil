<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Task } from '$lib/types/project';
  
  const dispatch = createEventDispatcher();
  
  export let existingTask: Task | null = null;
  export let existingTaskIds: string[] = [];
  
  let id: string = existingTask?.id || '';
  let name: string = existingTask?.name || '';
  let duration: number = existingTask?.duration || 1;
  let dependencies: string[] = existingTask?.dependencies || [];
  
  function handleSubmit() {
    const task: Task = {
      id,
      name,
      duration,
      dependencies
    };
    
    dispatch('save', task);
    
    // Reset form if not editing
    if (!existingTask) {
      id = '';
      name = '';
      duration = 1;
      dependencies = [];
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="task-form">
  <h3>{existingTask ? 'Edit Task' : 'Add New Task'}</h3>
  
  <div class="form-group">
    <label for="id">Task ID:</label>
    <input 
      type="text" 
      id="id" 
      bind:value={id} 
      required
      placeholder="A unique identifier (e.g., A, Task1)" 
      disabled={!!existingTask}
    />
  </div>
  
  <div class="form-group">
    <label for="name">Task Name:</label>
    <input 
      type="text" 
      id="name" 
      bind:value={name} 
      required
      placeholder="Descriptive name for the task"
    />
  </div>
  
  <div class="form-group">
    <label for="duration">Duration (days):</label>
    <input 
      type="number" 
      id="duration" 
      bind:value={duration} 
      min="1" 
      required
    />
  </div>
  
  <div class="form-group">
    <label for="dependencies">Dependencies:</label>
    <select multiple bind:value={dependencies}>
      {#each existingTaskIds.filter(tid => tid !== id) as taskId}
        <option value={taskId}>{taskId}</option>
      {/each}
    </select>
    <small>Hold Ctrl/Cmd to select multiple tasks</small>
  </div>
  
  <div class="form-actions">
    <button type="submit" class="btn primary">
      {existingTask ? 'Update Task' : 'Add Task'}
    </button>
    {#if existingTask}
      <button type="button" class="btn secondary" on:click={() => dispatch('cancel')}>
        Cancel
      </button>
    {/if}
  </div>
</form>

<style>
  .task-form {
    margin-bottom: 1.5rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: bold;
  }
  
  input, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 3px;
  }
  
  select[multiple] {
    height: 100px;
  }
  
  small {
    display: block;
    margin-top: 0.3rem;
    color: #666;
  }
  
  .form-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .primary {
    background-color: #4CAF50;
    color: white;
  }
  
  .secondary {
    background-color: #f1f1f1;
    color: #333;
  }
</style>
