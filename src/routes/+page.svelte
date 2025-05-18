<script lang="ts">
  import { onMount } from 'svelte';
  import type { Project, Task, CPMResults } from '$lib/types/project';
  import { calculateCPM } from '$lib/utils/cpm';
  
  let project: Project = {
    id: 'new',
    name: 'New Project',
    description: 'A new CPM project',
    tasks: []
  };
  
  let cpmResults: CPMResults | null = null;
  let editingTask: Task | null = null;
  
  // Zmienne formularza
  let taskId = '';
  let taskName = '';
  let taskDuration = 1;
  let taskDependenciesStr = '';
  
  function resetForm() {
    taskId = '';
    taskName = '';
    taskDuration = 1;
    taskDependenciesStr = '';
  }
  
  function startEditTask(task: Task) {
    editingTask = task;
    taskId = task.id;
    taskName = task.name;
    taskDuration = task.duration;
    taskDependenciesStr = task.dependencies.join(',');
  }
  
  function cancelEditTask() {
    editingTask = null;
    resetForm();
  }
  
  function handleSubmit() {
    const dependencies = taskDependenciesStr.split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);
    
    const task: Task = {
      id: taskId,
      name: taskName,
      duration: taskDuration,
      dependencies
    };
    
    if (editingTask) {
      // Aktualizacja istniejącego zadania
      project = {
        ...project,
        tasks: project.tasks.map(t => 
          t.id === task.id ? task : t
        )
      };
      editingTask = null;
    } else {
      // Dodanie nowego zadania
      project = {
        ...project,
        tasks: [...project.tasks, task]
      };
    }
    
    resetForm();
  }
  
  function deleteTask(taskId: string) {
    project = {
      ...project,
      tasks: project.tasks.filter(task => task.id !== taskId)
    };
  }
  
  function calculateProject() {
    if (project.tasks.length > 0) {
      cpmResults = calculateCPM(project.tasks);
    } else {
      alert('Add tasks to calculate CPM.');
    }
  }
</script>

<main>
  <h1>CPM Calculator</h1>
  
  <div class="project-header">
    <h2>{project.name}</h2>
    {#if project.description}
      <p class="description">{project.description}</p>
    {/if}
  </div>
  
  <div class="container">
    <div class="task-management">
      <h3>Task Management</h3>
      
      <div class="task-form">
        <h4>{editingTask ? 'Edit Task' : 'Add New Task'}</h4>
        
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="taskId">Task ID:</label>
            <input 
              type="text" 
              id="taskId" 
              bind:value={taskId}
              required
              disabled={!!editingTask}
            />
          </div>
          
          <div class="form-group">
            <label for="taskName">Task Name:</label>
            <input 
              type="text" 
              id="taskName" 
              bind:value={taskName}
              required
            />
          </div>
          
          <div class="form-group">
            <label for="taskDuration">Duration (days):</label>
            <input 
              type="number" 
              id="taskDuration" 
              bind:value={taskDuration}
              min="1" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="taskDependencies">Dependencies (comma separated):</label>
            <input 
              type="text" 
              id="taskDependencies" 
              bind:value={taskDependenciesStr}
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn primary">
              {editingTask ? 'Update Task' : 'Add Task'}
            </button>
            {#if editingTask}
              <button type="button" class="btn secondary" on:click={cancelEditTask}>
                Cancel
              </button>
            {/if}
          </div>
        </form>
      </div>
      
      <div class="task-list">
        <h4>Tasks ({project.tasks.length})</h4>
        
        {#if project.tasks.length === 0}
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
              {#each project.tasks as task}
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
                    <button class="btn edit" on:click={() => startEditTask(task)}>Edit</button>
                    <button class="btn delete" on:click={() => deleteTask(task.id)}>Delete</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          
          <div class="calculate-actions">
            <button class="btn primary" on:click={calculateProject}>Calculate CPM</button>
          </div>
        {/if}
      </div>
    </div>
    
    {#if cpmResults}
      <div class="cpm-results">
        <h3>CPM Results</h3>
        
        <div class="results-summary">
          <div class="summary-item">
            <span class="label">Project Duration:</span>
            <span class="value">{cpmResults.projectDuration} days</span>
          </div>
          <div class="summary-item">
            <span class="label">Critical Path:</span>
            <span class="value">{cpmResults.criticalPath.join(' → ')}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Earliest Start</th>
              <th>Earliest Finish</th>
              <th>Latest Start</th>
              <th>Latest Finish</th>
              <th>Slack</th>
              <th>Critical?</th>
            </tr>
          </thead>
          <tbody>
            {#each Object.values(cpmResults.results) as result}
              <tr class={result.isCritical ? 'critical' : ''}>
                <td>{result.taskId}</td>
                <td>{result.earliestStart}</td>
                <td>{result.earliestFinish}</td>
                <td>{result.latestStart}</td>
                <td>{result.latestFinish}</td>
                <td>{result.slack}</td>
                <td>{result.isCritical ? 'Yes' : 'No'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  .project-header {
    margin-bottom: 1.5rem;
  }
  
  .description {
    color: #555;
  }
  
  .container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .task-management, .cpm-results {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
  
  .task-form, .task-list {
    margin-bottom: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: bold;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 3px;
  }
  
  .form-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .calculate-actions {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
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
  
  .edit {
    background-color: #2196F3;
    color: white;
  }
  
  .delete {
    background-color: #f44336;
    color: white;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  th {
    background-color: #f2f2f2;
  }
  
  tr.critical {
    background-color: #ffeeee;
  }
  
  .results-summary {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
  }
  
  .summary-item {
    display: flex;
    gap: 0.5rem;
  }
  
  .label {
    font-weight: bold;
  }
  
  .empty-message {
    font-style: italic;
    color: #666;
  }
</style>
