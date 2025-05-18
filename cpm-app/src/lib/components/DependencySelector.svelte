<script lang="ts">
  import { Task } from '$lib/types/project';
  import { createEventDispatcher } from 'svelte';

  export let tasks: Task[] = [];
  export let selectedDependencies: string[] = [];
  export let currentTaskId: string | null = null;
  export let allowCircular: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { dependencies: string[] };
  }>();

  // Filter out tasks that would create circular dependencies if selected
  $: availableTasks = filterAvailableTasks(tasks, currentTaskId);

  // Keep track of tasks that would create a cycle if selected
  $: circularTasks = tasks.filter(
    task => !isTaskSelectable(task, currentTaskId, selectedDependencies)
  );

  // Toggle a task dependency
  function toggleDependency(taskId: string) {
    if (selectedDependencies.includes(taskId)) {
      selectedDependencies = selectedDependencies.filter(id => id !== taskId);
    } else {
      selectedDependencies = [...selectedDependencies, taskId];
    }
    dispatch('change', { dependencies: selectedDependencies });
  }

  // Filter tasks to prevent circular dependencies
  function filterAvailableTasks(tasks: Task[], currentTaskId: string | null): Task[] {
    if (!currentTaskId) return tasks;
    
    // Current task can't depend on itself
    const filtered = tasks.filter(task => task.id !== currentTaskId);
    
    // If circular dependencies are allowed, return all tasks except current
    if (allowCircular) return filtered;
    
    // Otherwise, filter out tasks that would create a cycle
    return filtered.filter(task => 
      isTaskSelectable(task, currentTaskId, selectedDependencies)
    );
  }

  // Check if selecting a task would create a circular dependency
  function isTaskSelectable(
    task: Task, 
    currentTaskId: string | null,
    selectedDeps: string[]
  ): boolean {
    if (!currentTaskId) return true;
    if (task.id === currentTaskId) return false;
    
    // Check if the task directly or indirectly depends on the current task
    const visited = new Set<string>();
    
    function hasCycle(taskId: string): boolean {
      if (taskId === currentTaskId) return true;
      if (visited.has(taskId)) return false;
      
      visited.add(taskId);
      
      const taskToCheck = tasks.find(t => t.id === taskId);
      if (!taskToCheck) return false;
      
      return taskToCheck.dependencies.some(depId => hasCycle(depId));
    }
    
    return !hasCycle(task.id);
  }
</script>

<div class="dependency-selector">
  <label class="field-label">Dependencies</label>
  
  {#if tasks.length === 0 || (currentTaskId && tasks.length === 1)}
    <p class="empty-message">No tasks available for dependencies</p>
  {:else}
    <div class="task-list">
      {#each availableTasks as task}
        {#if task.id !== currentTaskId}
          <div class="task-item">
            <label class="task-checkbox">
              <input
                type="checkbox"
                checked={selectedDependencies.includes(task.id)}
                on:change={() => toggleDependency(task.id)}
              />
              <span class="task-name">{task.name}</span>
              <span class="task-duration">({task.duration} days)</span>
            </label>
          </div>
        {/if}
      {/each}
      
      {#if circularTasks.length > 0 && !allowCircular}
        <div class="circular-warning">
          <h4>Cannot select (would create circular dependencies):</h4>
          <ul>
            {#each circularTasks as task}
              <li>{task.name}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dependency-selector {
    margin-bottom: 1rem;
  }
  
  .field-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  .task-list {
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    padding: 0.5rem;
  }
  
  .task-item {
    padding: 0.25rem 0;
  }
  
  .task-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  .task-name {
    margin-left: 0.5rem;
    font-weight: 500;
  }
  
  .task-duration {
    margin-left: 0.25rem;
    font-size: 0.875rem;
    color: #666;
  }
  
  .empty-message {
    color: #666;
    font-style: italic;
    padding: 0.5rem;
  }
  
  .circular-warning {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .circular-warning h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
    color: #856404;
  }
  
  .circular-warning ul {
    margin: 0;
    padding-left: 1.5rem;
  }
</style>