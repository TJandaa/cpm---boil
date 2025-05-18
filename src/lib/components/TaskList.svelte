<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Task } from '$lib/types/project';
  
  export let tasks: Task[] = [];
  
  const dispatch = createEventDispatcher();
  
  function editTask(task: Task) {
    dispatch('edit', task);
  }
  
  function deleteTask(taskId: string) {
    if (confirm(`Are you sure you want to delete task "${taskId}"?`)) {
      dispatch('delete', taskId);
    }
  }
</script>

<div class="task-list">
  <h3>Tasks ({tasks.length})</h3>
  
  {#if tasks.length === 0}
    <p class="empty-message">No tasks added yet. Use the form above to add tasks.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Duration</th>
          <th>Dependencies</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each tasks as task}
          <tr>
            <td>{task.id}</td>
            <td>{task.name}</td>
            <td>{task.duration} days</td>
            <td>
              {task.dependencies.length > 0 
                ? task.dependencies.join(', ') 
                : '(none)'}
            </td>
            <td class="actions">
              <button class="btn edit" on:click={() => editTask(task)}>Edit</button>
              <button class="btn delete" on:click={() => deleteTask(task.id)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .task-list {
    margin-bottom: 1.5rem;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .empty-message {
    font-style: italic;
    color: #666;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  th {
    background-color: #f2f2f2;
  }
  
  .actions {
    display: flex;
    gap: 0.3rem;
  }
  
  .btn {
    padding: 0.3rem 0.6rem;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .edit {
    background-color: #4CAF50;
    color: white;
  }
  
  .delete {
    background-color: #f44336;
    color: white;
  }
</style>

